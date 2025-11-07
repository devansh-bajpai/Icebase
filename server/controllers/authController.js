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
//
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