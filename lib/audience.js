"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.disconnecting = exports.vote = exports.lowerPlacard = exports.raisePlacard = exports.leave = exports.join = exports.connect = void 0;

var _index = require("./index");

var _room = require("./room");

const connect = function () {
  const uuid = _index.uuids.get(this);

  const roomCode = _index.uuidInRoom[uuid];

  const member = roomCode && _room.roomStates[roomCode].audience.get(uuid);

  if (member) {
    join.call(this, member, () => {});
  } // eslint-disable-next-line no-console


  console.log("An audience member connected");
}; // When an audience member joins a room with a country name


exports.connect = connect;

const join = function (member, reject) {
  member.roomCode = member.roomCode.toUpperCase();
  member.status = "connected";
  member.placard = member.placard || {
    raised: false
  };
  const {
    roomCode,
    countryName
  } = member;

  const uuid = _index.uuids.get(this); // Rejections


  if (!member) return reject("Could not join a room because no data was passed to the server.");
  if (!roomCode) return reject("Could not join a room because no room code was entered.");
  if (!countryName) return reject("Could not join a room because no country name was entered.");
  if (!(roomCode in _room.roomStates)) return reject(`Could not join ${roomCode} as it doesn't exist or is no longer available.`);
  _index.uuidInRoom[uuid] = roomCode; // Set the data in the audience Map

  _room.roomStates[roomCode].audience.set(uuid, member); // Join room with socket


  this.join(roomCode); // Send initial state

  (0, _room.sendPickedState)(this, roomCode, ["committee", "voting"], {
    member
  }); // Broadcast audience change to speakers in room

  (0, _room.sendAudience)(roomCode); // eslint-disable-next-line no-console

  console.log(`${countryName} joined room ${roomCode}`);
};

exports.join = join;

const leave = function (member) {
  member.roomCode = member.roomCode.toUpperCase();
  const {
    roomCode,
    countryName
  } = member;

  const uuid = _index.uuids.get(this);

  delete _index.uuidInRoom[uuid]; // Delete audience member

  _room.roomStates[roomCode].audience.delete(uuid); // Leave room with socket


  this.leave(roomCode); // Send empty state

  (0, _room.sendState)(this, undefined, {
    member: {},
    committee: ""
  }); // Broadcast audience change to speakers in room

  (0, _room.sendAudience)(roomCode); // eslint-disable-next-line no-console

  console.log(`${countryName || "An audience member"} left room ${roomCode}`);
};

exports.leave = leave;

const raisePlacard = function (clientMember) {
  const {
    roomCode,
    countryName
  } = clientMember;

  const uuid = _index.uuids.get(this);

  const member = _room.roomStates[roomCode].audience.get(uuid);

  member.placard = {
    raised: true,
    timeRaised: Date.now()
  };
  (0, _room.sendState)(this, roomCode, {
    member
  });
  (0, _room.sendAudience)(roomCode); // eslint-disable-next-line no-console

  console.log(`${countryName} raised their placard`);
};

exports.raisePlacard = raisePlacard;

const lowerPlacard = function (clientMember) {
  const {
    roomCode,
    countryName
  } = clientMember;

  const uuid = _index.uuids.get(this);

  const member = _room.roomStates[roomCode].audience.get(uuid);

  member.placard = {
    raised: false
  };
  (0, _room.sendState)(this, roomCode, {
    member
  });
  (0, _room.sendAudience)(roomCode); // eslint-disable-next-line no-console

  console.log(`${countryName} lowered their placard`);
};

exports.lowerPlacard = lowerPlacard;

const vote = function (clientMember, position) {
  const {
    roomCode,
    countryName
  } = clientMember;

  const uuid = _index.uuids.get(this);

  const member = _room.roomStates[roomCode].audience.get(uuid);

  if (!_room.roomStates[roomCode].voting) {
    return; // TODO: reject
  }

  member.vote = position;
  (0, _room.sendState)(this, roomCode, {
    member
  });
  (0, _room.sendAudience)(roomCode); // eslint-disable-next-line no-console

  console.log(`${countryName} voted ${position}`);
}; // Disconnection handler
// - `disconnecting` instead of `disconnect` to capture the rooms to update


exports.vote = vote;

const disconnecting = function (reason) {
  const uuid = _index.uuids.get(this); // Store rooms to update


  const rooms = Object.keys(this.rooms); // Iterate over rooms

  for (const roomCode of rooms) {
    // Skip the room made for the ID
    if (/\/audience#/.test(roomCode)) {
      continue;
    } // Is there more than one sockets (before removal of this one)?


    const hasOtherSockets = (0, _index.getSocketsByUuid)(uuid).length > 1; // If there's no other live sockets

    if (!hasOtherSockets) {
      const member = _room.roomStates[roomCode].audience.get(uuid); // Mark disconnected


      member.status = "disconnected"; // Broadcast audience change to speakers in room

      (0, _room.sendAudience)(roomCode);
    }
  } // Delete the UUID entry for this socket (doesn't delete other sockets using the same UUID)


  _index.uuids.delete(this); // eslint-disable-next-line no-console


  console.log(`An audience member disconnected (${reason})`);
};

exports.disconnecting = disconnecting;