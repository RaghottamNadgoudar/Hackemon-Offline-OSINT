import { authenticateToken, getSession, getRiddleData } from "../lib/utils.js";

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

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = authenticateToken(req);
    const sessionId = user.sessionId;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const currentRiddle = getRiddleData(session.currentRiddle);
    const maxAttempts = parseInt(process.env.MAX_ATTEMPTS_PER_RIDDLE || "3");

    res.status(200).json({
      currentRiddle: {
        number: session.currentRiddle,
        text: currentRiddle.text,
        total: parseInt(process.env.TOTAL_RIDDLES || "3"),
      },
      completedRiddles: session.completedRiddles,
      attemptsLeft:
        maxAttempts - (session.attempts[session.currentRiddle] || 0),
    });
  } catch (error) {
    console.error("Challenge status error:", error);
    res
      .status(500)
      .json({ error: "Failed to get challenge status: " + error.message });
  }
}
