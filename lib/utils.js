import jwt from "jsonwebtoken";
import crypto from "crypto";

// In-memory session store (use database in production)
const sessions = new Map();

export const hashKey = (key) => {
  let encrypted = "";
  for (let i = 0; i < key.length; i++) {
    const charCode = key.charCodeAt(i);
    encrypted += String.fromCharCode(charCode + 5 - (i % 3));
  }
  return Buffer.from(encrypted).toString("base64");
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const getRiddleData = (riddleNumber) => {
  return {
    text: process.env[`RIDDLE_${riddleNumber}_TEXT`],
    lat: parseFloat(process.env[`RIDDLE_${riddleNumber}_LAT`]),
    lng: parseFloat(process.env[`RIDDLE_${riddleNumber}_LNG`]),
    key: process.env[`RIDDLE_${riddleNumber}_KEY`],
  };
};

export const authenticateToken = (req) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new Error("Access token required");
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const getSession = (sessionId) => {
  return sessions.get(sessionId);
};

export const setSession = (sessionId, sessionData) => {
  sessions.set(sessionId, sessionData);
};

export const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: `${process.env.SESSION_TIMEOUT_MINUTES || "60"}m`,
  });
};
