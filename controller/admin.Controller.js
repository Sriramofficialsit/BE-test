const express = require("express");
const admin = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Staff = require("../models/Staff.model");
const Payment = require("../models/Payment");
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

/* LOGIN */
admin.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const staff = await Staff.findOne({ email });
  if (!staff) return res.status(400).json({ message: "Invalid user" });

  const match = await bcrypt.compare(password, staff.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: staff._id, role: staff.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    staff: {
      id: staff._id,
      email: staff.email,
      role: staff.role,
    },
  });
});

/* LOGOUT */
admin.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

/* CURRENT USER */
admin.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

/* STAFF LIST */
admin.get("/staff", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const staff = await Staff.find({ role: "staff" });
    res.json({ staff });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* REGISTER STAFF */
admin.post("/register", authMiddleware, requireAdmin, async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await Staff.findOne({ email });
  if (exists) return res.status(400).json({ message: "Already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const newStaff = await Staff.create({
    name,
    email,
    password: hashed,
    role: "staff",
  });

  res.json({ staff: newStaff });
});

/* DELETE STAFF */
admin.delete("/delete/:id", authMiddleware, requireAdmin, async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

/* UPDATE STAFF */
admin.put("/update/:id", authMiddleware, requireAdmin, async (req, res) => {
  const update = { name: req.body.name, email: req.body.email };

  if (req.body.password) {
    update.password = await bcrypt.hash(req.body.password, 10);
  }

  const staff = await Staff.findByIdAndUpdate(req.params.id, update, {
    new: true,
  });

  res.json({ staff });
});

/* TICKETS */
admin.get("/tickets", authMiddleware, async (req, res) => {
  const tickets = await Payment.find().sort({ createdAt: -1 });
  res.json({ data: tickets, success: true });
});

admin.get("/tickets/count", authMiddleware, async (req, res) => {
  const count = await Payment.countDocuments();
  res.json({ totalTickets: count });
});

admin.put("/tickets/redeem/:id", authMiddleware, async (req, res) => {
  const ticket = await Payment.findOneAndUpdate(
    { _id: req.params.id, isUsed: false },
    { isUsed: true },
    { new: true }
  );

  if (!ticket) {
    return res.status(400).json({ message: "Already used or invalid" });
  }

  res.json({ success: true });
});

module.exports = admin;
