// routers/messageRouter.js
const express = require('express');
const { 
  getUsersForSidebar, 
  getSelectedMessage, 
  markMessageAsSeen, 
  sendMessage, 
  editMessage, 
  deleteMessageForme, 
  deleteMessageForEveryone 
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/middleware');
const { uploadMedia, uploadImageOnly } = require('../lib/multerConfig');

const messageRouter = express.Router();

messageRouter.get("/sidebar-user", verifyToken, getUsersForSidebar);
messageRouter.get("/selected-user/:id", verifyToken, getSelectedMessage);
messageRouter.post("/markmessage", verifyToken, markMessageAsSeen);

// Voice + Image + Text সব accept করবে
messageRouter.post(
  "/send-message/:receiverId",
  verifyToken,
  uploadMedia,        // এটাই ম্যাজিক
  sendMessage
);

// Edit message এ শুধু image থাকলে
messageRouter.post("/edit-message/:messageId", verifyToken, uploadImageOnly, editMessage);

messageRouter.delete("/delete-message/:messageId", verifyToken, deleteMessageForme);
messageRouter.delete("/delete-message-everyone/:messageId", verifyToken, deleteMessageForEveryone);

module.exports = messageRouter;