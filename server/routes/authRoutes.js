// routes/authRoutes.js
import express from "express";
import {
  registerUser,
  verifyEmailOTP,
  resendEmailOTP,
  loginUser,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);

// Verify email with OTP
router.post("/verify-otp", verifyEmailOTP);

// Resend OTP
router.post("/resend-otp", resendEmailOTP);

// Login (rate limited: 8 requests / 30s per IP)
router.post("/login", loginLimiter, loginUser);

// Forgot password (send OTP)
router.post("/forgot-password", forgotPassword);

// Reset password with OTP
router.post("/reset-password", resetPassword);

// // Logout (JWT, client side)
// router.get("/logout", logoutUser);

export default router;
