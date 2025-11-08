const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const commonUserFields = {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
};

const tempUserSchema = new mongoose.Schema({
    ...commonUserFields,
    emailVerificationToken: String,
    emailVerificationTokenExpiry: Date,
}, { timestamps: true });

tempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

tempUserSchema.methods.generateEmailVerificationToken = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.emailVerificationToken = crypto.createHash("sha256").update(otp).digest("hex");
    this.emailVerificationTokenExpiry = Date.now() + 10 * 60 * 1000;
    return otp;
};

const TempUser = mongoose.model("TempUser", tempUserSchema);

const userSchema = new mongoose.Schema({
    ...commonUserFields,
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    isEmailVerified: { type: Boolean, default: true },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generatePasswordResetToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.forgotPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.forgotPasswordTokenExpiry = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = { User, TempUser };