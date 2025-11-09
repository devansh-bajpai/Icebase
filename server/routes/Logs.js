import express from "express";
import Log from "../models/Log.js";

const router = express.Router();

router.post("/last30days", async (req, res) => {
  try {
    const { api_key } = req.body; // ✅ read from body now

    const filter = api_key ? { api_key } : {};
    const logs = await Log.find(filter).sort({ timestamp: -1 }); // newest first

    console.log(`Fetched ${logs.length} logs`);

    res.status(200).json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching logs",
      error: error.message,
    });
  }
});

export default router;