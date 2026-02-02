const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    timeslot: { type: Date, required: true },
    nop: { type: Number, required: true },
    qrcode: { type: String },
    qrimg: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
