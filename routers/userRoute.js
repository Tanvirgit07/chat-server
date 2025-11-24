const express = require('express');
const { createrUser, signIn } = require('../controllers/userController');


const userRouter = express.Router();

userRouter.post("/signup", createrUser);
userRouter.post("/signin", signIn);



module.exports = userRouter;