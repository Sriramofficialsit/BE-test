const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const dbconnect = require("./config/db");
const paymentRoutes = require("./routes/payment");
const webhookRoutes = require("./routes/razorpayWebhook");
const adminRoutes = require("./controller/admin.Controller");

const app = express();

app.use(
  cors({
    origin: [
      "*",                 
    ],
    credentials: true,
  })
);


app.use("/webhook", webhookRoutes);


app.use(express.json());
app.use(cookieParser());


dbconnect();


app.use("/api", paymentRoutes);
app.use("/admin", adminRoutes);


app.get("/ping", (req, res) => {
  res.send("PING OK");
});


const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


