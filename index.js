require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectBD = require("./lib/dbconnection");
const userRouter = require("./routers/userRoute");
const messageRouter = require("./routers/mesageRouter");
const { initSocket } = require("./lib/socketio");

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(express.json({ limit: "5mb" }));
app.use(cors({ origin: "*" }));

// Connect DB
connectBD();

// Routes
app.use('/api/v1/user', userRouter);
app.use('/api/v1/message', messageRouter);

// Socket init
const { io } = initSocket(server); // initialize once

// Basic route
app.get("/", (req, res) => res.send("Server running"));

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));