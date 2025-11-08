// routes/authRoutes.js
import express from "express";
import {
  registerUser,
  verifyEmailOTP,
  resendEmailOTP,
  loginUser,
  
} from "../controllers/authController.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);

// Verify email with OTP
router.post("/verify-otp", verifyEmailOTP);

// Resend OTP
router.post("/resend-otp", resendEmailOTP);


router.post("/login", loginLimiter, loginUser);





// // Logout (JWT, client side)
// router.get("/logout", logoutUser);

export default router;
