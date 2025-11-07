
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 8, // Limit each IP to 8 login requests per 30s
  message: {
    success: false,
    message: "Too many login attempts. Try again after 30 seconds.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
