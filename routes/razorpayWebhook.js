const express = require("express");
const crypto = require("crypto");
const QRCode = require("qrcode");
const Payment = require("../models/Payment");
const sendEmail = require("../utils/sendEmail");
const generateTicketHTML = require("./ticketTemplate"); // Adjust path if needed

const router = express.Router();

/**
 * Razorpay Webhook Handler
 * Endpoint: POST /webhook/razorpay
 */
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      console.log("🔥 WEBHOOK HIT");

      // 1. Verify webhook signature
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers["x-razorpay-signature"];

      if (!secret) {
        console.error("Missing RAZORPAY_WEBHOOK_SECRET in environment");
        return res.status(500).send("Server configuration error");
      }

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      if (
        !signature ||
        !crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        )
      ) {
        console.error("❌ Invalid webhook signature");
        return res.status(400).send("Invalid signature");
      }

      // 2. Parse Razorpay event
      const event = JSON.parse(req.body.toString());
      console.log("📌 Event type:", event.event);

      // Only process successful payments
      if (event.event !== "payment.captured") {
        console.log(`Ignoring non-captured event: ${event.event}`);
        return res.status(200).json({ ignored: true });
      }

      const paymentEntity = event.payload.payment.entity;

      // 3. Find the corresponding pending payment
      const payment = await Payment.findOne({
        orderId: paymentEntity.order_id,
        status: "pending",
      });

      if (!payment) {
        console.warn(`⚠️ No pending payment found for orderId: ${paymentEntity.order_id}`);
        return res.status(200).json({ notFound: true });
      }

      // 4. Update payment record (idempotent)
      payment.paymentId = paymentEntity.id;
      payment.status = "paid";
      payment.amount = paymentEntity.amount / 100;

      // Generate ticket QR link
      const baseUrl = process.env.BASE_URL;
      payment.qrCode = `${baseUrl}/ticket/${payment._id}`;

      await payment.save();
      console.log("✅ Payment updated successfully:", payment._id);

      // 5. Generate QR code buffer
      const qrBuffer = await QRCode.toBuffer(payment.qrCode, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 300,
      });

      // 6. Format visit date in IST (this fixes the date being shown one day earlier)
      const visitDateIST = new Date(payment.visitDate).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      // 7. Generate ticket HTML with IST-formatted date
      const ticketId = payment._id.toString().slice(0, 8).toUpperCase();

      const html = generateTicketHTML({
        name: payment.name,
        persons: payment.persons,
        location: payment.location,
        visitDate: visitDateIST,           // ← now already formatted as string in IST
        amount: payment.amount,
        ticketId,
      });

      // 8. Send confirmation email with QR attached
      await sendEmail(
        payment.email,
        "Your Frutico Ice Cream Ticket 🎫",
        html,
        [
          {
            filename: "frutico-ticket.png",
            content: qrBuffer,
            cid: "frutico-qr",
          },
        ]
      );

      console.log("📨 Email sent successfully to:", payment.email);

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("🔥 WEBHOOK PROCESSING ERROR:", err.stack || err);
      return res.status(500).send("Webhook processing error");
    }
  }
);

module.exports = router;