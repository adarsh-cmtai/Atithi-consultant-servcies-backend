const paymentService = require("../service/payment.service.js");

const createOrder = async (req, res) => {
    try {
        const order = await paymentService.generateOrder(req.body.amount);
        res.status(200).json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ message: "Could not create payment order." });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const isValid = paymentService.validatePayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (isValid) {
            res.status(200).json({ success: true, message: "Payment verified successfully." });
        } else {
            res.status(400).json({ success: false, message: "Invalid payment signature." });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ message: "Payment verification failed." });
    }
};

module.exports = { createOrder, verifyPayment };