const { User, TempUser } = require("../../models/user.model.js");
const { sendEmail } = require("../../services/email.service.js");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
    });
};

const getProfile = async (req, res) => {
    return res.status(200).json({
        message: "User profile fetched successfully",
        user: {
            id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.user.role,
        }
    });
};

const registerUser = async (req, res) => {
    const { fullName, email, password, phoneNumber } = req.body;
    if (!fullName || !email || !password || !phoneNumber) return res.status(400).json({ message: "All fields are required" });
    if (!validator.isEmail(email)) return res.status(400).json({ message: "Please provide a valid email" });
    if (!validator.isMobilePhone(phoneNumber, 'any', { strictMode: false })) return res.status(400).json({ message: "Please provide a valid phone number" });
    const existingVerifiedUser = await User.findOne({ email });
    if (existingVerifiedUser) return res.status(409).json({ message: "An account with this email already exists." });
    await TempUser.deleteOne({ email });
    const tempUser = new TempUser({ fullName, email, password, phoneNumber });
    const emailVerificationOTP = tempUser.generateEmailVerificationToken();
    await tempUser.save();
    const emailHtml = `<h1>Welcome to Atithi Services!</h1><p>Your email verification OTP is: <strong>${emailVerificationOTP}</strong></p><p>This OTP is valid for 10 minutes.</p>`;
    try {
        await sendEmail(tempUser.email, "Verify Your Email Address", emailHtml);
        res.status(201).json({ message: "Registration initiated. Please check your email for verification OTP." });
    } catch (error) {
        await TempUser.deleteOne({ email });
        res.status(500).json({ message: "Failed to send verification email. Please try again." });
    }
};

const verifyEmail = async (req, res) => {
    const { otp } = req.body;
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
    const tempUser = await TempUser.findOne({ emailVerificationToken: hashedOTP, emailVerificationTokenExpiry: { $gt: Date.now() } });
    if (!tempUser) return res.status(400).json({ message: "OTP is invalid or has expired." });
    const newUser = new User({
        fullName: tempUser.fullName,
        email: tempUser.email,
        password: tempUser.password,
        phoneNumber: tempUser.phoneNumber,
        role: 'customer',
    });
    await newUser.save();
    await TempUser.findByIdAndDelete(tempUser._id);
    res.status(200).json({ message: "Email verified successfully. You can now log in." });
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.isPasswordCorrect(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };

    res.status(200).cookie("token", token, cookieOptions).json({
        message: "Logged in successfully",
        user: { 
            id: user._id, 
            fullName: user.fullName, 
            email: user.email, 
            role: user.role 
        },
        token,
    });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User with this email does not exist." });
    }
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailHtml = `<h1>Password Reset Request</h1><p>Click the link to reset your password: <a href="${resetURL}">${resetURL}</a></p><p>This link is valid for 10 minutes.</p>`;
    try {
        await sendEmail(user.email, "Password Reset Request", emailHtml);
        res.status(200).json({ message: "Password reset link sent to your email." });
    } catch (error) {
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpiry = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500).json({ message: "Failed to send password reset email." });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Token is invalid or has expired." });
    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successfully." });
};

const logoutUser = (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    res.clearCookie("token", cookieOptions);
    res.status(200).json({ message: "Logged out successfully." });
};

module.exports = {getProfile, registerUser, verifyEmail, loginUser, forgotPassword, resetPassword, logoutUser };