const express = require('express');
const { getUsersForSidebar, getSelectedMessage, markMessageAsSeen, sendMessage } = require('../controllers/messageController');
const { verifyToken } = require('../middleware/middleware');
const upload = require('../lib/multerConfig');

const messageRouter = express.Router();

messageRouter.get("/sidebar-user", verifyToken, getUsersForSidebar);
messageRouter.get("/selected-user/:id", verifyToken, getSelectedMessage);
messageRouter.post("/markmessage", verifyToken, markMessageAsSeen);
messageRouter.post("/send-message/:receiverId",verifyToken,upload.single("image"),sendMessage);

module.exports = messageRouter;