const { Server } = require("socket.io");

function initSocket(server) {
    const io = new Server(server, { cors: { origin: "*" } });
    const userSocketMap = {};

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        console.log("User connected:", userId);

        if (userId) {
            userSocketMap[userId] = socket.id;
        }

        io.emit("getOnlineUsers", Object.keys(userSocketMap));

        socket.on("disconnect", () => {
            console.log("User disconnected:", userId);
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        });
    });
    return { io, userSocketMap };
}

module.exports = initSocket;
