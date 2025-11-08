const mongoose = require("mongoose");

const contactInquirySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['New', 'Replied', 'Closed'],
        default: 'New'
    },
}, { timestamps: true });

const ContactInquiry = mongoose.model("ContactInquiry", contactInquirySchema);

module.exports = ContactInquiry;