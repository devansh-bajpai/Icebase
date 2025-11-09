import express from "express";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../controllers/apiKeyController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new API key
router.post("/", createApiKey);

// List all API keys for the authenticated user
router.get("/", listApiKeys);

// Revoke (delete) an API key
router.delete("/:id", revokeApiKey);

<<<<<<< HEAD
export default router;

=======
export default router;
>>>>>>> 9ede3a764bdda6eb40b24e7bf98e491e9593fcc3
