const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const handleError = require("../lib/HandleError");
const jwt = require("jsonwebtoken");
const sendMail = require("../lib/mailsend");
const cloudinary = require("../");

const createrUser = async (req, res, next) => {
  const { fullName, email, password, bio } = req.body;
  try {
    if (!fullName || !email || !password || !bio) {
      return res.status(400).json({
        success: false,
        message: "All fildes are required !",
      });
    }

    const existingUser = await UserModel.findOne({ email: email.trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists!",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      fullName: fullName.trim(),
      email: email.trim(),
      password: hashPassword,
      bio: bio,
    });

    res.status(200).json({
      success: true,
      message: "User created Successfully !",
      data: newUser,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email/Phone and password are required !",
      });
    }

    const user = await UserModel.findOne({ email: email });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid credentials !",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: "Invalid credentials !",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "User login successfully !",
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
      },
      accessToken: token,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email: email });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "If that email exists, an OTP has been sent !",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashOtp = await bcrypt.hash(otp, 10);

    user.resetOtpHash = hashOtp;
    user.resetOtpExpire = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save();

    await sendMail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px;">
      <div style="max-width: 500px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #1a73e8; text-align: center;">Your OTP Code</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">Use the following OTP to reset your password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 4px;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #555;">This code will expire in <b>10 minutes</b>. Please do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  `,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully!",
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const varifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      res.status(400).json({
        success: false,
        message: "All filds are required !",
      });
    }

    const user = await UserModel.findOne({ email: email });
    if (!user) {
      res.json(400).json({
        success: false,
        message: "User not found !",
      });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtpHash);
    console.log(isMatch);
    if (!user.resetOtpHash || !isMatch) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP!",
      });
    }

    if (user.resetOtpExpire < Date.now()) {
      res.status(400).json({
        success: false,
        message: "OTP expired !",
      });
    }

    (user.resetOtpExpire = undefined), (user.resetOtpHash = undefined);

    const resetToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.status(200).json({
      success: true,
      message: "OTP verified successfully !",
      resetToken: resetToken,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, resetToken } = req.body;

    if (!email || !newPassword || !resetToken) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token!",
      });
    }

    if (!decoded?.id) {
      return res.status(400).json({
        success: false,
        message: "Invalid token payload!",
      });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found!",
      });
    }

    if (user.email !== email) {
      return res.status(400).json({
        success: false,
        message: "Email mismatch!",
      });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully!",
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { fullName, email, bio, profileImage } = req.body;

    const updateData = {
      email,
      fullName,
      password,
      profileImage,
      bio,
    };

    if (req.file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path);

        updateData.profileImage = uploadResult.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadErr) {
        return next(
          handleError(500, "Image upload failed: " + uploadErr.message)
        );
      }
    } else if (profileImage) {
      updateData.profileImage = profileImage;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

module.exports = {
  createrUser,
  signIn,
  forgotPassword,
  varifyOtp,
  resetPassword,
};
