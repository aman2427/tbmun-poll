"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendAudience = exports.getSpeakers = exports.getAudience = exports.getMembers = exports.sendPickedState = exports.sendState = exports.makeRoom = exports.makeRoomCode = exports.roomStates = void 0;

var _index = require("./index");

var _util = require("./util");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Create object for the state for each room
const roomStates = {}; // The length of randomly created room codes

exports.roomStates = roomStates;
const roomCodeLength = 4; // Make a random, available room code of four letters

const makeRoomCode = function () {
  let roomCode; // This while loop will hang if there's few options left, but this is
  // for one conference not thousands, so my lazy butt is okay for now lol

  while (!roomCode || roomStates[roomCode]) {
    // Get random uppercase code
    roomCode = String.fromCharCode( // Fill array with `roomCodeLength` number of random numbers corresponding
    // to uppercase char codes, spread into `fromCharCode`'s ...args
    ...new Array(roomCodeLength).fill() // Random number between 65 through 90, inclusive
    .map(() => Math.round(Math.random() * 25) + 65));
  }

  return roomCode;
}; // Initialize a room in the `roomStates` object
// - Room code and initial state are optional


exports.makeRoomCode = makeRoomCode;

const makeRoom = function (roomCode, initialState = {}) {
  // Get room code from either provided (uppercased) or make one
  roomCode = roomCode.toUpperCase() || makeRoomCode(); // Initialize state for new room

  roomStates[roomCode] = _objectSpread({
    // Default committee
    committee: "",
    // Boolean for if the room is voting
    voting: false,
    // Initialize the stored audience members
    audience: new Map(),
    // Initialize the stored speakers
    speakers: new Map()
  }, initialState); // Return back capitalized/generated room code

  return roomCode;
};

exports.makeRoom = makeRoom;

const sendState = function (namespace, roomCode, data) {
  // If the "namespace" is actually a Socket instance
  const isSocket = Object.getPrototypeOf(namespace).constructor.name === "Socket"; // Emit update state event
  // Don't send to a room if there isn't one or if it's a socket

  (!isSocket && roomCode ? namespace.to(roomCode) : namespace).emit("set state", data);
};

exports.sendState = sendState;

const sendPickedState = function (namespace, roomCode, properties, additions = {}) {
  sendState(namespace, roomCode, _objectSpread({}, additions, {}, (0, _util.pick)(roomStates[roomCode], ...properties)));
};

exports.sendPickedState = sendPickedState;

const getMembers = function (type, roomCode) {
  return [...roomStates[roomCode][type]].map(([uuid, member]) => {
    return _objectSpread({}, member, {
      uuid
    });
  });
};

exports.getMembers = getMembers;

const getAudience = function (roomCode) {
  return getMembers("audience", roomCode);
};

exports.getAudience = getAudience;

const getSpeakers = function (roomCode) {
  return getMembers("speakers", roomCode);
};

exports.getSpeakers = getSpeakers;

const sendAudience = function (roomCode) {
  sendState(_index.speakerNamespace, roomCode, {
    audience: getAudience(roomCode)
  });
};

exports.sendAudience = sendAudience;