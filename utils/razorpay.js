const Razorpay = require("razorpay");
require("dotenv").config();
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const sendEmail = require("../utils/sendEmail");

module.exports = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
