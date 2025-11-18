// --- START OF FILE payment/service/payment.service.js ---

const axios = require("axios");
const crypto = require("crypto");
const { User } = require("../../models/user.model.js");

const CASHFREE_BASE_URL = process.env.CASHFREE_ENV === "PRODUCTION" 
  ? "https://api.cashfree.com/pg" 
  : "https://sandbox.cashfree.com/pg";

const createCashfreeSession = async (paymentInfo, orderId, orderAmount) => {
  let customer_details;

  if (paymentInfo.userId) {
    const user = await User.findById(paymentInfo.userId);
    if (!user) {
      throw new Error("User not found");
    }
    customer_details = {
      customer_id: user._id.toString(),
      customer_email: user.email,
      customer_phone: user.phoneNumber,
      customer_name: user.fullName,
    };
  } else if (paymentInfo.customerDetails) {
    const guestEmail = paymentInfo.customerDetails.customer_email;
    const guestCustomerId = `guest_${guestEmail.replace(/[@.]/g, '_')}`;
    
    customer_details = {
      ...paymentInfo.customerDetails,
      customer_id: guestCustomerId,
    };
  } else {
    throw new Error("Payment information is missing.");
  }

  const request = {
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: "INR",
    customer_details: customer_details,
    order_meta: {
      return_url: `${process.env.FRONTEND_URL}/payment-status?order_id={order_id}`,
    },
  };

  try {
    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders`,
      request,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        },
      }
    );
    
    return {
      payment_session_id: response.data.payment_session_id,
      order_id: response.data.order_id,
      order_status: response.data.order_status
    };
  } catch (error) {
    console.error("Cashfree API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create payment session");
  }
};

const verifyCashfreePayment = (headers, payload) => {
  try {
    const signature = headers["x-webhook-signature"];
    const timestamp = headers["x-webhook-timestamp"];
    
    if (!signature || !timestamp) {
      return false;
    }

    const signatureData = timestamp + payload;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_SECRET_KEY)
      .update(signatureData)
      .digest("base64");

    return signature === generatedSignature;
  } catch (error) {
    console.error("Error verifying Cashfree signature:", error);
    return false;
  }
};

module.exports = { createCashfreeSession, verifyCashfreePayment };