import ApiKey from "../models/ApiKey.js";
import { generateApiKey } from "../utils/generateApiKey.js";
import { emitToUser } from "../utils/socketManager.js";

export async function createApiKey(req, res) {
  try {
    const userId = req.userData.id; // from auth middleware
    const key = generateApiKey();

    const newKey = new ApiKey({ userId, key });
    await newKey.save();

    // Emit socket notification
    emitToUser(userId, "notification", {
      message: "Your API key has been created successfully!",
      type: "success",
    });

    res.status(201).json({
      message: "API Key generated successfully",
      apiKey: newKey.key,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating API key" });
  }
}

export async function listApiKeys(req, res) {
  try {
    const userId = req.userData.id;
    // console.log(userId);
    
    const keys = await ApiKey.find({ userId });
    console.log("found keys:", keys);
    
    res.status(200).json(keys);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching API keys" });
  }
}

export async function revokeApiKey(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userData.id;

    const key = await ApiKey.findOneAndDelete({ _id: id, userId });
    if (!key) return res.status(404).json({ message: "API key not found" });

    // Emit socket notification
    emitToUser(userId, "notification", {
      message: "Your API key has been revoked successfully.",
      type: "info",
    });

    res.status(200).json({ message: "API Key revoked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error revoking API key" });
  }
}

