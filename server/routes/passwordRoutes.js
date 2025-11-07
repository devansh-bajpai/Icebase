// routes/passwordRoutes.js
import express from "express";
import { forgotPassword, resetPassword } from "../controllers/passwordController.js";

const router = express.Router();

// Forgot password (send reset email)
router.post("/forgot", forgotPassword);

// Reset password (verify token and change password)
router.put("/reset/:token", resetPassword);

export default router;
