const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat"
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file", "video"],
    default: "text"
  },
  text: { type: String },
  image: { type: String },
  seen: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
  deletedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
