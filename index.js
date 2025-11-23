require("dotenv").config();
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const http = require('http');
const connectBD = require("./lib/dbconnection");

const app = express();
const server = http.createServer(app);



app.use(express.json({limit: '4mb'}));
app.use(cors({
    origin: "*",
}));


connectBD();

app.use('/', (req,res) => {
    res.send("Server is running");
})


server.listen(PORT, () => {
    console.log(`Server is running http://localhost:${PORT}`)
})




// global error handler 
app.use((err,req,res,next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error!";
    res.status(statusCode).json({
        success : false,
        statusCode,
        message,
    });
})