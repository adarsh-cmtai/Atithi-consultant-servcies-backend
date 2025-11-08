const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ['Pending', 'In Review', 'Approved', 'Rejected'], default: 'Pending' },
    fullName: { type: String, required: true },
    dob: { type: Date },
    age: { type: Number },
    gender: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    position: { type: String, required: true },
    currentSalary: { type: String },
    expectedSalary: { type: String, required: true },
    experience: { type: Number, required: true },
    currentLocation: { type: String, required: true },
    noticePeriod: { type: String },
    preferLocation: { type: String, required: true },
    authorized: { type: Boolean, default: false },
    employerName: { type: String },
    department: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    reasonForLeaving: { type: String },
    currentDesignation: { type: String },
    degree: { type: String },
    percentage: { type: String },
    aadhaar: { type: String },
    uan: { type: String },
    languages: { type: String },
    declaration: { type: Boolean, required: true },
    paymentDetails: {
        orderId: String,
        paymentId: String,
        amount: Number,
    },
}, { timestamps: true });

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

module.exports = JobApplication;