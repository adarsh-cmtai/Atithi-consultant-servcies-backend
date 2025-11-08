const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ['update', 'message'],
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    link: {
        type: String, // Optional: e.g., a link to the specific application
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;