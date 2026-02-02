const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["staff", "admin"],
      default: "staff",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
