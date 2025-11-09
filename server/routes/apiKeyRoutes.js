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

export default router;

