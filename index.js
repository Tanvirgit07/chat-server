require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectBD = require("./lib/dbconnection");
const userRouter = require("./routers/userRoute");

// create express app & server
const app = express();
const server = http.createServer(app);

// SOCKET INIT
const initSocket = require("./lib/socketio");

const { io, userSocketMap } = initSocket(server);

// middlewares
app.use(express.json({ limit: "5mb" }));
app.use(cors({ origin: "*" }));

// connect DB
connectBD();


app.use('/api/v1/user', userRouter);

// basic route
app.get("/", (req, res) => res.send("Server running"));

// global error handler
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// export io and map for controllers
module.exports = { io, userSocketMap };
