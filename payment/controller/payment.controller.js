// --- START OF FILE payment/controller/payment.controller.js ---

const { createCashfreeSession, verifyCashfreePayment } = require("../service/payment.service.js");
const crypto = require("crypto");

const createPaymentSession = async (req, res) => {
  try {
    const orderId = `order_${crypto.randomBytes(8).toString("hex")}`;
    const orderAmount = 450;
    
    let paymentInfo;

    if (req.user) {
      paymentInfo = { userId: req.user._id.toString() };
    } else {
      const { fullName, email, phone } = req.body;
      if (!fullName || !email || !phone) {
        return res.status(400).json({ message: "Customer details are required for guest payment." });
      }
      paymentInfo = {
        customerDetails: {
          customer_name: fullName,
          customer_email: email,
          customer_phone: phone,
        }
      };
    }

    const sessionData = await createCashfreeSession(paymentInfo, orderId, orderAmount);
    
    res.status(200).json({
      message: "Cashfree session created successfully",
      data: sessionData,
    });
  } catch (error) {
    console.error("Payment session error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to create payment session." 
    });
  }
};

const verifyPaymentWebhook = async (req, res) => {
  const headers = req.headers;
  const payload = req.rawBody;

  const isValid = verifyCashfreePayment(headers, payload);

  if (isValid) {
    const eventData = req.body.data;
    if (eventData.order.order_status === "PAID") {
      console.log(`Payment successful for order: ${eventData.order.order_id}`);
    } else {
      console.log(`Payment status for order ${eventData.order.order_id}: ${eventData.order.order_status}`);
    }
  } else {
    console.error("Invalid webhook signature.");
    return res.status(400).send("Invalid signature");
  }

  res.status(200).send("Webhook received");
};

module.exports = { createPaymentSession, verifyPaymentWebhook };