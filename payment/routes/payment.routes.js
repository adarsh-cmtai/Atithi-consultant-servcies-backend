const express = require("express");
const { createPaymentSession, verifyPaymentWebhook } = require("../controller/payment.controller");
const { verifyJWT } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/create-session", verifyJWT, createPaymentSession);
router.post("/webhook/verify", verifyPaymentWebhook);

module.exports = router;
