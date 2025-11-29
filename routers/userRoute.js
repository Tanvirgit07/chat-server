const express = require('express');
const { createrUser, signIn, updateUser, getAllusers, getSingleUser } = require('../controllers/userController');
const { verifyToken } = require('../middleware/middleware');
const { uploadImageOnly } = require('../lib/multerConfig');


const userRouter = express.Router();

userRouter.post("/signup", createrUser);
userRouter.post("/signin", signIn);
userRouter.post("/update-profile", verifyToken, uploadImageOnly, updateUser);
userRouter.get("/single-user/:id", getSingleUser);



module.exports = userRouter;