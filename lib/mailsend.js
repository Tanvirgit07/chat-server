const nodemailer = require("nodemailer");

const sendMail = async ({ to, text, html, subject }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      to,
      subject,
      text,
      html,
    });

    console.log(info.messageId);
    return true
  } catch (err) {
console.log(err)
return false
  }
};


module.exports = sendMail
