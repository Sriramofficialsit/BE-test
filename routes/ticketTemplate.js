module.exports = function generateTicketHTML({
  name,
  persons,
  location,
  visitDate,     // ← UTC Date from DB – already formatted correctly in previous steps
  amount,
  ticketId,
}) {
  // Format visit date in IST (already correct from previous fix)
  let formattedVisitDate = "—";
  if (visitDate) {
    formattedVisitDate = new Date(visitDate).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  // Branch display name
  const branchName =
    location === "annanagar" ? "Annanagar Ulavar Santhai" :
    location === "kulithalai" ? "Kulithalai" :
    location || "—";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frutico – Your Ice Cream Ticket</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      color: white;
      padding: 50px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .header .subtitle {
      margin: 12px 0 0;
      font-size: 18px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
      background: #fff;
    }
    .ticket-card {
      background: linear-gradient(145deg, #f0fff4, #e6ffed);
      border: 3px dashed #27ae60;
      border-radius: 16px;
      padding: 30px;
      margin: 0 auto 30px;
      max-width: 480px;
      text-align: center;
    }
    .ticket-card h2 {
      color: #27ae60;
      margin: 0 0 25px;
      font-size: 26px;
    }
    .details-table {
      width: 100%;
      margin: 0 auto 30px;
      border-collapse: collapse;
    }
    .details-table td {
      padding: 14px 10px;
      font-size: 16px;
      border-bottom: 1px solid #e0f0e0;
    }
    .label {
      font-weight: 600;
      color: #2c3e50;
      text-align: left;
      width: 40%;
    }
    .value {
      text-align: right;
      color: #27ae60;
      font-weight: 700;
    }
    .qr-area {
      margin: 35px 0 25px;
    }
    .qr-area h3 {
      color: #27ae60;
      font-size: 20px;
      margin: 0 0 20px;
    }
    .qr-img {
      width: 220px;
      height: 220px;
      border: 4px solid #27ae60;
      border-radius: 12px;
      background: white;
      padding: 12px;
      box-shadow: 0 4px 15px rgba(39,174,96,0.2);
    }
    .instructions {
      background: #f1f8f5;
      border-left: 5px solid #27ae60;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: left;
    }
    .instructions h4 {
      margin: 0 0 15px;
      color: #27ae60;
      font-size: 18px;
    }
    .instructions ul {
      margin: 0;
      padding-left: 22px;
    }
    .instructions li {
      margin-bottom: 12px;
      font-size: 15px;
      line-height: 1.5;
    }
    .footer {
      background: #27ae60;
      color: white;
      text-align: center;
      padding: 25px 30px;
      font-size: 14px;
    }
    .footer p {
      margin: 6px 0;
    }
    @media (max-width: 600px) {
      .details-table td {
        display: block;
        width: 100%;
        text-align: center;
        border-bottom: none;
      }
      .value { margin-top: 6px; }
      .ticket-card { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Frutico Ticket Confirmed!</h1>
      <div class="subtitle">Your unlimited natural fruit ice cream experience awaits 🍦🌿</div>
    </div>

    <div class="content">
      <div class="ticket-card">
        <h2>Your Frutico Pass</h2>

        <table class="details-table">
          <tr><td class="label">Name</td><td class="value">${name}</td></tr>
          <tr><td class="label">Persons</td><td class="value">${persons}</td></tr>
          <tr><td class="label">Branch</td><td class="value">${branchName}</td></tr>
          <tr>
            <td class="label">Visit Date</td>
            <td class="value">${formattedVisitDate}</td>
          </tr>
          <tr><td class="label">Amount Paid</td><td class="value">₹${amount}</td></tr>
          <tr><td class="label">Ticket ID</td><td class="value">${ticketId}</td></tr>
        </table>

        <div class="qr-area">
          <h3>Scan at Counter</h3>
          <img src="cid:frutico-qr" class="qr-img" alt="Your QR Code" />
        </div>
      </div>

      <div class="instructions">
        <h4>Important Instructions</h4>
        <ul>
          <li>Present this QR code at the Frutico counter on your visit date</li>
          <li>Valid only for the selected date and number of persons</li>
          <li>One-time use per ticket – non-transferable</li>
          <li>No refunds or exchanges after redemption</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing Frutico – Real Fruits, Village Fresh Milk, Pure Happiness</p>
      <p>© ${new Date().getFullYear()} Frutico Natural Ice Cream</p>
    </div>
  </div>
</body>
</html>
  `;
};