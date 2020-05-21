"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uuidMiddleware = exports.getSocketsByUuid = exports.getEntriesByUuid = exports.hasUuidEntry = exports.getUuidFromCookie = exports.uuidInRoom = exports.uuids = exports.speakerNamespace = exports.audienceNamespace = exports.io = void 0;

var _express = _interopRequireDefault(require("express"));

var _socket = _interopRequireDefault(require("socket.io"));

var _v = _interopRequireDefault(require("uuid/v4"));

var _path = _interopRequireDefault(require("path"));

var _room = require("./room");

var audience = _interopRequireWildcard(require("./audience"));

var speaker = _interopRequireWildcard(require("./speaker"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Room helper functions
// Server-sider sockets code for each context
const DEVELOPMENT = process.env.NODE_ENV === "development"; // Setup express app

const app = (0, _express.default)(); // Paths

const publicPath = _path.default.resolve(__dirname, "../public");

const modulesPath = _path.default.resolve(__dirname, "../node_modules"); // Serve static assets first


app.use("/bootstrap", _express.default.static(modulesPath + "/bootstrap/dist"));
app.use("/", _express.default.static(publicPath)); // Serve all routes as `index.html` for client-side routing

app.get("/*", (request, response) => {
  response.sendFile("/index.html", {
    root: publicPath
  });
}); // Listen, create server
// - Configurable dev and prod ports, currently the same because of
//   using a reverse proxy

const server = app.listen(DEVELOPMENT ? 8080 : 8080); // Create Socket.io server on express server instance

const io = _socket.default.listen(server); // Create namespaces for the audience and speakers


exports.io = io;
const audienceNamespace = io.of("/audience");
exports.audienceNamespace = audienceNamespace;
const speakerNamespace = io.of("/speaker");
exports.speakerNamespace = speakerNamespace;
const uuids = new Map();
exports.uuids = uuids;
const uuidInRoom = {};
exports.uuidInRoom = uuidInRoom;

const getUuidFromCookie = function (cookie) {
  var _$exec;

  return (_$exec = /(?:^|;\s*)uuid\s*=\s*([^;]*)/.exec(cookie)) === null || _$exec === void 0 ? void 0 : _$exec[1];
};

exports.getUuidFromCookie = getUuidFromCookie;

const hasUuidEntry = function (uuid) {
  return [...uuids.values()].includes(uuid);
};

exports.hasUuidEntry = hasUuidEntry;

const getEntriesByUuid = function (uuid) {
  return [...uuids].filter(([, value]) => value === uuid);
};

exports.getEntriesByUuid = getEntriesByUuid;

const getSocketsByUuid = function (uuid) {
  var _getEntriesByUuid;

  return (_getEntriesByUuid = getEntriesByUuid(uuid)) === null || _getEntriesByUuid === void 0 ? void 0 : _getEntriesByUuid.map(([socket]) => socket);
};

exports.getSocketsByUuid = getSocketsByUuid;

const uuidMiddleware = function (socket, next) {
  const handshakeData = socket.request; // Initialize with the cookie from the client

  let uuid = getUuidFromCookie(handshakeData.headers.cookie); // If there's no UUID set or it's set but it's found on the server

  if (!uuid && !hasUuidEntry(uuid)) {
    // Create a new UUID
    uuid = (0, _v.default)(); // Instruct the client to remember it

    socket.emit("uuid", uuid);
  } // Add this socket key in the UUID Map


  uuids.set(socket, uuid); // Pass along to next Socket-IO middleware

  next();
}; // Use UUID middleware on both namespaces
// It cannot be added only to the root `io` server because the `socket` object before
// switching namespaces is a different reference than after doing so


exports.uuidMiddleware = uuidMiddleware;
audienceNamespace.use(uuidMiddleware);
speakerNamespace.use(uuidMiddleware); // Make a debugging room if in development mode
// This helps with hot reloaded/synced browsers that autoconnect to a room

if (DEVELOPMENT) {
  (0, _room.makeRoom)("TEST", {
    committee: "Committee of Debugging"
  });
} // Event handler for audience member connections


audienceNamespace.on("connect", function (socket) {
  // Room handlers
  socket.on("join", audience.join);
  socket.on("leave", audience.leave); // Interaction handlers

  socket.on("raise placard", audience.raisePlacard);
  socket.on("lower placard", audience.lowerPlacard);
  socket.on("vote", audience.vote); // Disconnection handler

  socket.on("disconnecting", audience.disconnecting); // Bubble up to audience submodule with `this` bound to `socket`

  audience.connect.apply(socket, arguments);
}); // Event handler for speaker connections

speakerNamespace.on("connect", function (socket) {
  // Room handlers
  socket.on("list rooms", speaker.listRooms);
  socket.on("create room", speaker.createRoom);
  socket.on("join", speaker.join);
  socket.on("leave", speaker.leave); // Interaction handlers

  socket.on("start voting", speaker.startVoting);
  socket.on("end voting", speaker.endVoting);
  socket.on("lower placard", speaker.lowerPlacard); // Disconnection handler

  socket.on("disconnecting", speaker.disconnecting); // Bubble up to speaker submodule with `this` bound to `socket`

  speaker.connect.apply(socket, arguments);
}); // eslint-disable-next-line no-console

console.log(`Server is running at ${DEVELOPMENT ? "localhost:8080" : "poll.tritonmun.org"}/`);