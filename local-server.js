import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  getRiddleData,
  setSession,
  createToken,
  authenticateToken,
  getSession,
  calculateDistance,
  hashKey,
} from "./lib/utils.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PORT should come from environment
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Your APIs
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

// Serve frontend static files from Vite build (dist/)
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
