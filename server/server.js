
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";
import { authenticateSocket } from "./utils/socketAuth.js";
import {
  setIO,
  registerUserSocket,
  unregisterUserSocket,
} from "./utils/socketManager.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
// Consolidated CORS (allow localhost and optional CLIENT_URL)
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ].filter(Boolean),
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/keys", apiKeyRoutes);

app.get("/", (req, res) => {
  res.send("Secure Login System API Running...");
});

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ success: false, message: err.message || "Server Error" });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ].filter(Boolean),
    credentials: true,
  },
});

// Set IO instance in socket manager
setIO(io);

// Socket.IO authentication middleware
io.use(authenticateSocket);

// Socket.IO connection handler
io.on("connection", (socket) => {
  const userId = socket.userData?.id;
  
  if (userId) {
    // Register user socket
    registerUserSocket(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Handle disconnect
    socket.on("disconnect", () => {
      unregisterUserSocket(userId);
      console.log(`User ${userId} disconnected`);
    });
  } else {
    socket.disconnect();
    console.log("Socket connection rejected: No user ID");
  }
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
