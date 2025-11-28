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


const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { newText } = req.body;
    const userId = req.user._id;

    if (!newText || newText.trim() === "") {
      return res.status(400).json({ success: false, message: "Text is required" });
    }

    const message = await MessageModel.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages"
      });
    }

    // আপডেট করো
    message.text = newText.trim();
    message.edited = true;
    await message.save();

    // Real-time দুই পাশেই পাঠাও
    const io = getIo();
    const userSocketMap = getUserSocketMap();

    const senderSocketId = userSocketMap[message.senderId.toString()];
    const receiverSocketId = userSocketMap[message.receiverId.toString()];

    const updatedMessage = message.toObject();
    updatedMessage.edited = true;

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageEdited", updatedMessage);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", updatedMessage);
    }

    return res.json({ success: true, message: "Message edited", data: updatedMessage });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const deleteMessageForme = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await MessageModel.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Already deleted?
    if (!message.deletedBy) message.deletedBy = [];
    if (message.deletedBy.includes(userId)) {
      return res.json({ success: true, message: "Already deleted for you" });
    }

    message.deletedBy.push(userId);
    await message.save();

    // Real-time: শুধু নিজের কাছে পাঠাও
    const io = getIo();
    const userSocketMap = getUserSocketMap();
    const deleterSocketId = userSocketMap[userId.toString()];

    if (deleterSocketId) {
      io.to(deleterSocketId).emit("messageDeleted", {
        messageId: messageId,
        deletedFor: [userId.toString()]
      });
    }

    return res.json({ success: true, message: "Message deleted for me" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteMessageForEveryone = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await MessageModel.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only sender can delete the message for everyone"
      });
    }

    // মেসেজ ডিলিট করো ডাটাবেস থেকে
    await MessageModel.findByIdAndDelete(messageId);

    // Real-time: দুই পাশেই পাঠাও
    const io = getIo();
    const userSocketMap = getUserSocketMap();

    const senderSocketId = userSocketMap[message.senderId.toString()];
    const receiverSocketId = userSocketMap[message.receiverId.toString()];

    const deletePayload = {
      messageId: messageId,
      deletedForEveryone: true
    };

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", deletePayload);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", deletePayload);
    }

    return res.json({ success: true, message: "Message deleted for everyone" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {
  getUsersForSidebar,
  getSelectedMessage,
  markMessageAsSeen,
  sendMessage,
  editMessage,
  deleteMessageForme,
  deleteMessageForEveryone
};