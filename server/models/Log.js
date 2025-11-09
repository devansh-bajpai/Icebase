import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  api_key: String,
  uid: String,
  timestamp: { type: Date, default: Date.now },
  logType: String
});

export default mongoose.model("Log", logSchema, "logs");