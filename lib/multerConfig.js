// lib/multerConfig.js ← এই ফাইলটা পুরোটা রিপ্লেস করো
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "audio/webm", "audio/mp4", "audio/mpeg", "video/webm"
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images and audio files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// ১. শুধু ইমেজ (প্রোফাইল আপডেট, এডিট মেসেজ, অন্যান্য ফিচারের জন্য)
const uploadImageOnly = upload.single("image");

// ২. ভয়েস + ইমেজ দুটোই (send-message এর জন্য)
const uploadMedia = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "voice", maxCount: 1 }
]);

// ৩. যদি কোথাও upload.any() লাগে (ভবিষ্যতে)
const uploadAny = upload.any();

// সব এক্সপোর্ট করছি
module.exports = {
  upload,           // ← যদি কেউ সরাসরি upload চায়
  uploadImageOnly,  // ← প্রোফাইল, এডিট মেসেজ
  uploadMedia,      // ← send-message (voice + image)
  uploadAny         // ← ভবিষ্যতের জন্য
};