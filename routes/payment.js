const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const razorpay = require("../utils/razorpay");

const PRICE_PER_PERSON = 1;                // ← changed back to 99 as per your frontend
const DAILY_LIMIT_PER_BRANCH = 100;

router.post("/create-order", async (req, res) => {
  try {
    const { persons, name, email, phone, location, visitDate } = req.body;

    if (!name || !email || !phone || !location || !visitDate || !persons || persons < 1) {
      return res.status(400).json({ error: "All fields are required, persons must be at least 1" });
    }

    const requestedCount = Number(persons);

    // ────────────────────────────────────────────────
    // FIXED: Treat date string as pure UTC calendar day
    // ────────────────────────────────────────────────
    const startOfDay = new Date(`${visitDate}T00:00:00.000Z`);
    const endOfDay   = new Date(`${visitDate}T23:59:59.999Z`);

    if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
      return res.status(400).json({ error: "Invalid visit date format (use YYYY-MM-DD)" });
    }

    const alreadyBooked = await Payment.countDocuments({
      location,
      visitDate: { $gte: startOfDay, $lte: endOfDay },
      status: "paid",
    });

    if (alreadyBooked + requestedCount > DAILY_LIMIT_PER_BRANCH) {
      const remaining = DAILY_LIMIT_PER_BRANCH - alreadyBooked;
      return res.status(400).json({
        error: `Only ${remaining} ticket${remaining === 1 ? "" : "s"} remaining for this branch on ${visitDate}.`,
        remaining,
        limit: DAILY_LIMIT_PER_BRANCH,
        alreadyBooked,
      });
    }

    const amount = requestedCount * PRICE_PER_PERSON;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { name, email, phone, persons: requestedCount, location, visitDate },
    });

    await Payment.create({
      orderId: order.id,
      name,
      email,
      phone,
      persons: requestedCount,
      location,
      visitDate: new Date(`${visitDate}T00:00:00.000Z`), // also store consistently
      amount,
      status: "pending",
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({ error: "Order creation failed. Please try again." });
  }
});

router.get("/availability", async (req, res) => {
  try {
    const { location, visitDate } = req.query;

    if (!location || !visitDate) {
      return res.status(400).json({ error: "location and visitDate are required" });
    }

    // ────────────────────────────────────────────────
    // FIXED: Treat date string as pure UTC calendar day
    // ────────────────────────────────────────────────
    const startOfDay = new Date(`${visitDate}T00:00:00.000Z`);
    const endOfDay   = new Date(`${visitDate}T23:59:59.999Z`);

    if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
      return res.status(400).json({ error: "Invalid date format (YYYY-MM-DD)" });
    }

    const booked = await Payment.countDocuments({
      location,
      visitDate: { $gte: startOfDay, $lte: endOfDay },
      status: "paid",
    });

    const remaining = Math.max(0, DAILY_LIMIT_PER_BRANCH - booked);

    res.json({
      location,
      visitDate,
      booked,
      remaining,
      limit: DAILY_LIMIT_PER_BRANCH,
      isAvailable: remaining > 0,
    });
  } catch (err) {
    console.error("AVAILABILITY ERROR:", err);
    res.status(500).json({ error: "Failed to check availability" });
  }
});

module.exports = router;