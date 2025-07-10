import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  getRiddleData,
  setSession,
  createToken,
  authenticateToken,
  getSession,
  calculateDistance,
  hashKey,
} from "./lib/utils.js";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Import API logic from your api files
app.post("/api/start-challenge", async (req, res) => {
  const { default: handler } = await import("./api/start-challenge.js");
  return handler(req, res);
});

app.post("/api/verify-location", async (req, res) => {
  const { default: handler } = await import("./api/verify-location.js");
  return handler(req, res);
});

app.get("/api/challenge-status", async (req, res) => {
  const { default: handler } = await import("./api/challenge-status.js");
  return handler(req, res);
});

app.listen(PORT, () => {
  console.log(`🚀 Local API Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend will be available on http://localhost:3000`);
});
