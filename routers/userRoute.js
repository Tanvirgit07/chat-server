const express = require('express');
const { createrUser, signIn, updateUser } = require('../controllers/userController');
const { verifyToken } = require('../middleware/middleware');
const upload = require('../lib/multerConfig');


const userRouter = express.Router();

userRouter.post("/signup", createrUser);
userRouter.post("/signin", signIn);
userRouter.post("/update-profile",verifyToken,upload.single("image"), updateUser);



module.exports = userRouter;