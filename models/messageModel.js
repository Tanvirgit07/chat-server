const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
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
      default: "text",
    },
    text: { type: String },
    image: { type: String },
    seen: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    deletedBy: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    // নতুন যোগ করা Reply ফিল্ড
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      default: null,
    },
    replyToText: { type: String, default: "" },
    replyToImage: { type: String },
    replyToSenderName: { type: String }, // যিনি পাঠিয়েছেন তার নাম
  },
  { timestamps: true }
);

const MessageModel = mongoose.model("message", messageSchema);
module.exports = MessageModel;
