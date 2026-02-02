const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,           // Prevents duplicate orders
    },
    paymentId: String,
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    persons: {
      type: Number,
      required: true,
      min: 1,
    },
    location: {
      type: String,
      required: true,
      enum: ["annanagar", "kulithalai"],  // ← optional but good for data integrity
      index: true,                        // Speeds up queries by branch
    },
    visitDate: {
      type: Date,
      required: true,
      index: true,                        // Very important for date range queries
    },
    amount: Number,
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,                        // Helps when counting paid tickets
    },
    qrCode: String,
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Optional: Compound index for fast counting of paid tickets per branch/date
paymentSchema.index({ location: 1, visitDate: 1, status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);