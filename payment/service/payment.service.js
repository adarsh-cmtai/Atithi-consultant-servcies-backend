const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const generateOrder = async (amount) => {
    const options = {
        amount: amount * 100, // Amount in paisa
        currency: "INR",
        receipt: `receipt_order_${new Date().getTime()}`,
    };
    try {
        const order = await razorpayInstance.orders.create(options);
        return order;
    } catch (error) {
        throw new Error("Failed to create Razorpay order");
    }
};

const validatePayment = (order_id, payment_id, signature) => {
    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    sha.update(`${order_id}|${payment_id}`);
    const digest = sha.digest("hex");
    return digest === signature;
};

module.exports = { generateOrder, validatePayment };