// --- START OF FILE payment/routes/payment.routes.js ---

const express = require("express");
const { createPaymentSession, verifyPaymentWebhook } = require("../controller/payment.controller");
const { optionalAuth } = require("../../middlewares/optionalAuth.middleware");

const router = express.Router();

router.post("/create-session", optionalAuth, createPaymentSession);
router.post("/webhook/verify", verifyPaymentWebhook);

module.exports = router;