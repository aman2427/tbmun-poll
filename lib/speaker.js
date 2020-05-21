"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.disconnecting = exports.createRoom = exports.listRooms = exports.lowerPlacard = exports.endVoting = exports.startVoting = exports.leave = exports.join = exports.connect = void 0;

var _index = require("./index");

var _room = require("./room");

const connect = function () {
  // eslint-disable-next-line no-console
  console.log("A speaker connected");
}; // When a speaker joins a room


exports.connect = connect;

const join = function (member, reject) {
  member.roomCode = member.roomCode.toUpperCase();
  member.speaker = true;
  const {
    roomCode
  } = member;
  const {
    committee
  } = _room.roomStates[roomCode];

  const uuid = _index.uuids.get(this); // Rejections


  if (!member) return reject("Could not join a room because no data was passed to the server.");
  if (!roomCode) return reject("Could not join a room because no room code was entered.");
  if (!(roomCode in _room.roomStates)) return reject(`Could not join ${roomCode} as it doesn't exist or is no longer available.`);
  _index.uuidInRoom[uuid] = roomCode; // Set the data in the speakers Map

  _room.roomStates[roomCode].speakers.set(uuid, member); // Join room with socket


  this.join(roomCode); // Send initial state

  (0, _room.sendPickedState)(this, roomCode, ["committee", "voting"], {
    member,
    audience: (0, _room.getAudience)(roomCode),
    speakers: (0, _room.getSpeakers)(roomCode)
  }); // eslint-disable-next-line no-console

  console.log(`A speaker joined ${committee} (${roomCode})`);
};

exports.join = join;

const leave = function (member) {
  const {
    roomCode
  } = member;
  const {
    committee
  } = _room.roomStates[roomCode];

  const uuid = _index.uuids.get(this);

  delete _index.uuidInRoom[uuid]; // Delete speaker

  _room.roomStates[roomCode].speakers.delete(uuid); // Leave room with socket


  this.leave(roomCode); // Send empty state

  (0, _room.sendState)(this, undefined, {
    member: {},
    committee: "",
    voting: false,
    audience: [],
    speakers: []
  }); // eslint-disable-next-line no-console

  console.log(`A speaker left ${committee} (${roomCode})`);
};

exports.leave = leave;

const startVoting = function (member) {
  const {
    roomCode
  } = member;
  _room.roomStates[roomCode].voting = true;
  (0, _room.sendPickedState)(_index.speakerNamespace, roomCode, ["voting"]);
  (0, _room.sendPickedState)(_index.audienceNamespace, roomCode, ["voting"]); // eslint-disable-next-line no-console

  console.log(`Voting has started in ${roomCode}`);
};

exports.startVoting = startVoting;

const endVoting = function (member) {
  const {
    roomCode
  } = member;
  _room.roomStates[roomCode].voting = false;
  (0, _room.sendPickedState)(_index.speakerNamespace, roomCode, ["voting"]);
  (0, _room.sendPickedState)(_index.audienceNamespace, roomCode, ["voting"]); // Clear votes

  for (const [voterUuid, voterMember] of _room.roomStates[roomCode].audience) {
    delete voterMember.vote;
    const voterSockets = (0, _index.getSocketsByUuid)(voterUuid);

    for (const voterSocket of voterSockets) {
      (0, _room.sendState)(voterSocket, roomCode, {
        member: voterMember
      });
    }
  }

  (0, _room.sendAudience)(roomCode); // eslint-disable-next-line no-console

  console.log(`Voting has ended in ${roomCode}`);
};

exports.endVoting = endVoting;

const lowerPlacard = function (members) {
  for (const clientMember of members) {
    const {
      roomCode,
      countryName,
      uuid
    } = clientMember;

    const member = _room.roomStates[roomCode].audience.get(uuid);

    member.placard = {
      raised: false
    };
    const memberSockets = (0, _index.getSocketsByUuid)(uuid);

    for (const memberSocket of memberSockets) {
      (0, _room.sendState)(memberSocket, roomCode, {
        member
      });
    }

    (0, _room.sendAudience)(roomCode); // eslint-disable-next-line no-console

    console.log(`A speaker lowered ${countryName}'s placard`);
  }
};

exports.lowerPlacard = lowerPlacard;

const listRooms = function (resolve) {
  resolve({
    // Create an array of rooms for the client to display if wanting to join an existing room
    rooms: Object.keys(_room.roomStates).map(roomCode => {
      return {
        // Room code
        roomCode,
        // Extract state to send
        committee: _room.roomStates[roomCode].committee
      };
    })
  });
};

exports.listRooms = listRooms;

const createRoom = function (data, reject) {
  const {
    committee,
    join: joinOption
  } = data;
  let {
    roomCode
  } = data; // Send error to client if there the room isn't available

  if (roomCode in _room.roomStates) return reject(`The room code ${roomCode} is already in use.`); // Make new room, store room code if changed

  roomCode = (0, _room.makeRoom)( // Code to use if provied one
  roomCode, // State to override defaults
  {
    committee
  }); // eslint-disable-next-line no-console

  console.log(`Room created: ${committee} (${roomCode})`); // Join room if set

  joinOption && join.call(this, {
    roomCode
  }, reject);
}; // Disconnection handler
// - `disconnecting` instead of `disconnect` to capture the rooms to update


exports.createRoom = createRoom;

const disconnecting = function (reason) {
  const uuid = _index.uuids.get(this); // Store rooms to update


  const rooms = Object.keys(this.rooms); // Iterate over rooms

  for (const roomCode of rooms) {
    // Skip the room made for the ID
    if (/\/speaker#/.test(roomCode)) {
      continue;
    } // Delete speaker


    _room.roomStates[roomCode].speakers.delete(uuid);
  } // Delete the UUID entry for this socket (doesn't delete other sockets using the same UUID)


  _index.uuids.delete(this); // eslint-disable-next-line no-console


  console.log(`A speaker disconnected (${reason})`);
};

exports.disconnecting = disconnecting;