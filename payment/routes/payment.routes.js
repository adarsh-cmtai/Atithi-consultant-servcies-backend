const express = require("express");
const { createOrder, verifyPayment } = require("../controller/payment.controller.js");
const { verifyJWT } = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(verifyJWT);

router.route("/create-order").post(createOrder);
router.route("/verify-payment").post(verifyPayment);

module.exports = router;