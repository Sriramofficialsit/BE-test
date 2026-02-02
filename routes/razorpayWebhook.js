const express = require("express");
const crypto = require("crypto");
const QRCode = require("qrcode");
const Payment = require("../models/Payment");
const sendEmail = require("../utils/sendEmail");
const generateTicketHTML = require("./ticketTemplate"); // Adjust path if needed

const router = express.Router();

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    // ─── Always reply fast ────────────────────────────────────────
    res.status(200).json({ received: true });

    try {
      const signature = req.headers["x-razorpay-signature"];
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        console.error("Invalid signature");
        return; // already responded
      }

      const event = JSON.parse(req.body.toString());

      if (event.event !== "payment.captured") {
        return;
      }

      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const payment = await Payment.findOne({
        orderId,
        status: "pending",
      });

      if (!payment) {
        console.log(`No pending payment found for ${orderId}`);
        return;
      }

      // Update status – this must happen fast
      payment.status = "paid";
      payment.paymentId = paymentEntity.id;
      payment.amount = paymentEntity.amount / 100;
      payment.qrCode = `${process.env.BASE_URL}/ticket/${payment._id}`;
      await payment.save();

      console.log(`Payment marked as paid: ${payment._id}`);

      // Do slow work AFTER responding (fire and forget)
      processTicketAndEmail(payment).catch((err) => {
        console.error("Background ticket/email failed:", err);
        // TODO: you can add alert (email yourself / telegram / sentry)
      });
    } catch (err) {
      console.error("Webhook processing failed:", err);
      // still already responded 200
    }
  }
);

// Separate function – can be slow, no problem
async function processTicketAndEmail(payment) {
  try {
    const qrBuffer = await QRCode.toBuffer(payment.qrCode, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 300,
    });

    const visitDateIST = new Date(payment.visitDate).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const ticketId = payment._id.toString().slice(0, 8).toUpperCase();

    const html = generateTicketHTML({
      name: payment.name,
      persons: payment.persons,
      location: payment.location,
      visitDate: visitDateIST,
      amount: payment.amount,
      ticketId,
    });

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

    console.log(`Ticket email sent to ${payment.email}`);
  } catch (err) {
    console.error("Ticket/Email failed:", err);
    // You could mark payment as "paid_but_ticket_failed" or notify admin
  }
}


module.exports = router;
