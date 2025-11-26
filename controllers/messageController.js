const handleError = require("../lib/HandleError");
const UserModel = require("../models/userModel");
const { getIo, getUserSocketMap } = require("../lib/socketio");
const MessageModel = require("../models/messageModel");
const fs = require("fs");
const cloudinary = require("../lib/cloudinary");

const getUsersForSidebar = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await UserModel.find({ _id: { $ne: userId } }).select("-password");

    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await MessageModel.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });
    await Promise.all(promises);

    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const getSelectedMessage = async (req, res, next) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    await MessageModel.updateMany(
      { senderId: selectedUserId, receiverId: myId, seen: false },
      { seen: true }
    );

    const message = await MessageModel.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.json({ success: true, message });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const markMessageAsSeen = async (req, res, next) => {
  try {
    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ success: false, message: "messageIds required" });
    }

    await MessageModel.updateMany(
      { _id: { $in: messageIds } },
      { seen: true }
    );

    res.json({ success: true });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const receiverId = req.params.receiverId;
    const senderId = req.user._id;

    if (!text && !req.file) {
      return next(handleError(400, "Message text or image required"));
    }

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "chat_images" });
      imageUrl = result.secure_url;
      fs.unlink(req.file.path, () => {});
    }

    const newMessage = await MessageModel.create({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl,
    });

    // শুধু রিসিভারকে পাঠাও (সেন্ডারকে না)
    const io = getIo();
    const userSocketMap = getUserSocketMap();
    const receiverSocketId = userSocketMap[receiverId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // সেন্ডারকে কিছু পাঠানোর দরকার নেই – ফ্রন্টএন্ডে ইতিমধ্যে দেখানো হয়ে গেছে
    return res.json({ success: true, data: newMessage });
  } catch (err) {
    console.error("Message Send Error:", err);
    next(handleError(500, err.message));
  }
};

module.exports = {
  getUsersForSidebar,
  getSelectedMessage,
  markMessageAsSeen,
  sendMessage,
};