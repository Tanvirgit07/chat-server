const express = require('express');
const { getUsersForSidebar, getSelectedMessage, markMessageAsSeen, sendMessage, editMessage, deleteMessageForme, deleteMessageForEveryone } = require('../controllers/messageController');
const { verifyToken } = require('../middleware/middleware');
const upload = require('../lib/multerConfig');

const messageRouter = express.Router();

messageRouter.get("/sidebar-user", verifyToken, getUsersForSidebar);
messageRouter.get("/selected-user/:id", verifyToken, getSelectedMessage);
messageRouter.post("/markmessage", verifyToken, markMessageAsSeen);
messageRouter.post("/send-message/:receiverId",verifyToken,upload.single("image"),sendMessage);
messageRouter.post("/edit-message/:messageId",verifyToken,upload.single("image"),editMessage);
messageRouter.delete("/delete-message/:messageId",verifyToken,deleteMessageForme);
messageRouter.delete("/delete-message-everyone/:messageId",verifyToken,deleteMessageForEveryone);

module.exports = messageRouter;