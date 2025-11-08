
import crypto from "crypto";
import User from "../models/User.js";
import transporter from "../config/mail.js";
import { validatePassword } from "../middleware/passwordValidator.js";
import sendEmail from "../utils/sendEmail.js";
//
// FORGOT PASSWORD (OTP)
//

export const forgotPassword = async (req, res) => {
  try {
    if (!req.body || !req.body.email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }
    
    let { email } = req.body;
    
    // Normalize email
    email = email.toLowerCase();
    
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
    if (!req.body) {
      return res.status(400).json({ 
        success: false, 
        message: "Request body is required" 
      });
    }
    
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, OTP, and new password are required" 
      });
    }
    
    const normalizedEmail = email.toLowerCase();
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

