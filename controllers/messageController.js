const messageModel = require("../models/messageModel");
const handleError = require("../lib/HandleError");
const UserModel = require("../models/userModel");
const { io, userSocketMap } = require("../index");

const getUsersForSidebar = async (req, res, next) => {
  try {
    // Logged in user (Receiver)
    const userId = req.user._id;

    // Sidebar e sob user (nijeke bad diye)
    const filteredUsers = await UserModel.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    // Unseen message count store korar object
    const unseenMessages = {};

    // Loop every user (Sender)
    const promises = filteredUsers.map(async (user) => {
      // senderId = sidebar user
      // receiverId = logged in user
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

    res.json({
      success: true,
      users: filteredUsers,
      unseenMessages,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const getSelectedMessage = async (req, res, next) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const message = await messageModel.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });

    // read This message
    await messageModel.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    res.json({
      success: true,
      message,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

// api to make massages as seen using meessage id
const markMessageAsSeen = async (req, res, next) => {
  try {
    const { id } = req.params;
    await messageModel.findByIdAndUpdate(id, { seen: true });
    res.json({
      success: true,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const sendMessage = async (req, res, next) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl = null;

        if (image) {
            const Result = await cloudinary.uploader.upload(image, { folder: "chat_images" });
            imageUrl = Result.secure_url;
        }

        const newMessage = await messageModel.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.json({ success: true, data: newMessage });

    } catch (err) {
        next(handleError(500, err.message));
    }
};
