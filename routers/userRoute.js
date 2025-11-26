const express = require('express');
const { createrUser, signIn, updateUser, getAllusers } = require('../controllers/userController');
const { verifyToken } = require('../middleware/middleware');
const upload = require('../lib/multerConfig');


const userRouter = express.Router();

userRouter.post("/signup", createrUser);
userRouter.post("/signin", signIn);
userRouter.post("/update-profile",verifyToken,upload.single("image"), updateUser);
userRouter.get("/all-users",verifyToken, getAllusers);



module.exports = userRouter;