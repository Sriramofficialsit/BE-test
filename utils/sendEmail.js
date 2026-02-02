const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = async (to, subject, html, attachments = []) => {
  await transporter.sendMail({
    from: `"Frutico" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
};
