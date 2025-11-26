// lib/socketio.js
const { Server } = require("socket.io");

let io;
const userSocketMap = {};

function initSocket(server) {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User connected:", userId);

    if (userId) userSocketMap[userId] = socket.id;

    // Send current online users to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("User disconnected:", userId);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return { io, userSocketMap };
}

// Getter functions for controllers
function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

function getUserSocketMap() {
  return userSocketMap;
}

module.exports = { initSocket, getIo, getUserSocketMap };