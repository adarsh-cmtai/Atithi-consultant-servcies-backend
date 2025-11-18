// --- START OF FILE models/loanApplication.model.js ---

const mongoose = require("mongoose");

const loanApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
    status: { type: String, enum: ['Pending', 'In Review', 'Approved', 'Rejected'], default: 'Pending' },
    fullName: { type: String, required: true },
    pan: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String },
    maritalStatus: { type: String },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    aadhaar: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" },
    position: { type: String, required: true },
    employmentDate: { type: Date },
    employmentType: { type: String },
    monthlyIncome: { type: String, required: true },
    otherIncome: { type: String },
    loanAmount: { type: String, required: true },
    loanPurpose: { type: String },
    nomineeName: { type: String, required: true },
    nomineeContact: { type: String, required: true },
    nomineeAadhaar: { type: String, required: true },
    declaration: { type: Boolean, required: true },
    paymentDetails: {
        type: Object,
    },
}, { timestamps: true });

const LoanApplication = mongoose.model("LoanApplication", loanApplicationSchema);

module.exports = LoanApplication;