
import crypto from "crypto";
import User from "../models/User.js";
import transporter from "../config/mail.js";
import { validatePassword } from "../middleware/passwordValidator.js";

//
// FORGOT PASSWORD — send reset link
//
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ success: false, message: "No account with this email" });

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Build reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Password reset email sent. Check your inbox.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// RESET PASSWORD — verify token and update
//
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate strong password
    if (!validatePassword(password))
      return res.status(400).json({
        success: false,
        message:
          "Password must include 8+ chars, uppercase, lowercase, number, and special symbol",
      });

    // Hash token and find user
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: "Invalid or expired token" });

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
