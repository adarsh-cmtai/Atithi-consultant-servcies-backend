const express = require("express");
const { registerUser, verifyEmail, loginUser, forgotPassword, resetPassword, logoutUser, getProfile  } = require("../controller/auth.controller.js");
const { verifyJWT } = require("../../middlewares/auth.middleware.js");

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.get("/profile", verifyJWT, getProfile);
router.post("/logout", logoutUser);

module.exports = router;