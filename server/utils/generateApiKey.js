import crypto from "crypto";

export function generateApiKey() {
  // Generate a random API key
  // Format: prefix_randomString (e.g., "ice_abc123def456...")
  const randomBytes = crypto.randomBytes(32).toString("hex");
  return `ice_${randomBytes}`;
}

