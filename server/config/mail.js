import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

transporter.verify((error, success) => {
  if (error) console.error("Mailer error:", error.message);
  else console.log("Mailer ready");
});

export default transporter;

