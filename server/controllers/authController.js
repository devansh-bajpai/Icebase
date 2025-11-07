
import User from "../models/User.js"
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validatePassword } from "../middleware/passwordValidator.js";

//register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields are required" });

    if (!validatePassword(password))
      return res.status(400).json({
        success: false,
        message: "Password must include 8+ chars, uppercase, lowercase, number, and special symbol",
      });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ success: false, message: "Email already registered" });

    user = await User.create({ name, email, password });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    const message = `
      <h2>Hello, ${name}!</h2>
      <p>Use the following OTP to verify your email:</p>
      <h3>${otp}</h3>
      <p>This OTP expires in 10 minutes.</p>
    `;

    await sendEmail({ to: user.email, subject: "Verify your account", html: message });

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email for the OTP to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// VERIFY EMAIL (OTP)

export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid email" });

    if (
      user.emailVerificationOTP !== otp ||
      !user.emailVerificationOTPExpire ||
      user.emailVerificationOTPExpire < Date.now()
    )
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    user.isVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify Email OTP error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// RESEND EMAIL OTP

export const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    if (user.isVerified) return res.status(400).json({ success: false, message: "Email already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    const message = `
      <h2>Hello, ${user.name}!</h2>
      <p>Use the following OTP to verify your email:</p>
      <h3>${otp}</h3>
      <p>This OTP expires in 10 minutes.</p>
    `;

    await sendEmail({ to: user.email, subject: "Resend OTP - Verify your account", html: message });

    res.status(200).json({ success: true, message: "OTP resent successfully. Check your email." });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//login
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // Normalize email
    email = email.toLowerCase();

    // Fetch user including password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // No lockout in login logic; using rate limiter middleware for bursts

    // Auto-reset failed attempts if 30 seconds have passed since the last failure
    if (
      user.failedLoginAttempts > 0 &&
      user.lastFailedLoginAt &&
      Date.now() - new Date(user.lastFailedLoginAt).getTime() >= 30 * 1000
    ) {
      user.failedLoginAttempts = 0;
      user.lastFailedLoginAt = undefined;
      await user.save();
    }

    // If account is currently locked, block login
    if (user.accountLockUntil && user.accountLockUntil > Date.now()) {
      const secs = Math.ceil((user.accountLockUntil - Date.now()) / 1000);
      return res.status(403).json({
        success: false,
        message: `Account locked due to multiple failed login attempts. Try again in ${secs} seconds.`,
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLoginAt = new Date();
      // Autolock after 8 failed attempts for 30 seconds
      if (user.failedLoginAttempts >= 8) {
        user.accountLockUntil = Date.now() + 30 * 1000;
      }
      await user.save();

      if (user.accountLockUntil && user.accountLockUntil > Date.now()) {
        const secs = Math.ceil((user.accountLockUntil - Date.now()) / 1000);
        return res.status(403).json({
          success: false,
          message: `Account locked due to multiple failed login attempts. Try again in ${secs} seconds.`,
        });
      }

      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ success: false, message: "Email not verified. Please verify OTP first." });
    }

    // Successful login — reset counters
    user.failedLoginAttempts = 0;
    user.accountLockUntil = undefined;
    user.lastFailedLoginAt = undefined;
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "1h",
    });

    res.status(200).json({ success: true, token, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// FORGOT PASSWORD (OTP)
//
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    const message = `
      <p>Use this OTP to reset your password:</p>
      <h3>${otp}</h3>
      <p>This OTP expires in 10 minutes.</p>
    `;
    await sendEmail({ to: user.email, subject: "Reset Password OTP", html: message });

    res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot Password error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// RESET PASSWORD (OTP)
//
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email?.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp || user.resetPasswordOTPExpire < Date.now())
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    if (!validatePassword(newPassword))
      return res.status(400).json({
        success: false,
        message: "Password must include 8+ chars, uppercase, lowercase, number, and special symbol",
      });

    // Assign plain password and let pre-save hook hash it
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

