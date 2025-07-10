import { getRiddleData, setSession, createToken } from "../lib/utils.js";
import crypto from "crypto";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if environment variables are loaded
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not found in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const sessionId = crypto.randomUUID();
    const token = createToken({
      sessionId,
      currentRiddle: 1,
      startTime: Date.now(),
    });

    setSession(sessionId, {
      currentRiddle: 1,
      completedRiddles: [],
      attempts: {},
      startTime: Date.now(),
    });

    const firstRiddle = getRiddleData(1);

    // Check if riddle data is valid
    if (!firstRiddle.text) {
      console.error("Riddle data not found. Check environment variables.");
      return res.status(500).json({ error: "Riddle configuration error" });
    }

    res.status(200).json({
      success: true,
      token,
      riddle: {
        number: 1,
        text: firstRiddle.text,
        total: parseInt(process.env.TOTAL_RIDDLES || "3"),
      },
    });
  } catch (error) {
    console.error("Start challenge error:", error);
    res
      .status(500)
      .json({ error: "Failed to start challenge: " + error.message });
  }
}
