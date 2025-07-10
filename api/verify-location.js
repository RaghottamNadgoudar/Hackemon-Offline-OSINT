import {
  authenticateToken,
  getSession,
  setSession,
  getRiddleData,
  calculateDistance,
  hashKey,
  createToken,
} from "../lib/utils.js";

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
    const user = authenticateToken(req);
    const { latitude, longitude } = req.body;
    const sessionId = user.sessionId;
    const session = getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const currentRiddleNumber = session.currentRiddle;
    const riddleData = getRiddleData(currentRiddleNumber);

    if (!riddleData.text) {
      return res.status(404).json({ error: "Invalid riddle" });
    }

    // Initialize attempts for this riddle
    if (!session.attempts[currentRiddleNumber]) {
      session.attempts[currentRiddleNumber] = 0;
    }

    // Check attempt limit
    const maxAttempts = parseInt(process.env.MAX_ATTEMPTS_PER_RIDDLE || "3");
    if (session.attempts[currentRiddleNumber] >= maxAttempts) {
      return res
        .status(429)
        .json({ error: "Maximum attempts exceeded for this riddle" });
    }

    session.attempts[currentRiddleNumber]++;

    // Calculate distance
    const distance = calculateDistance(
      latitude,
      longitude,
      riddleData.lat,
      riddleData.lng
    );

    const tolerance = parseFloat(process.env.LOCATION_TOLERANCE_METERS || "2");

    if (distance <= tolerance) {
      // Correct location
      session.completedRiddles.push(currentRiddleNumber);
      const nextRiddleNumber = currentRiddleNumber + 1;
      const totalRiddles = parseInt(process.env.TOTAL_RIDDLES || "3");

      if (nextRiddleNumber <= totalRiddles) {
        // More riddles available
        session.currentRiddle = nextRiddleNumber;
        const nextRiddle = getRiddleData(nextRiddleNumber);

        // Update token
        const newToken = createToken({
          sessionId,
          currentRiddle: nextRiddleNumber,
          startTime: session.startTime,
        });

        setSession(sessionId, session);

        res.status(200).json({
          success: true,
          key: hashKey(riddleData.key),
          nextRiddle: {
            number: nextRiddleNumber,
            text: nextRiddle.text,
            total: totalRiddles,
          },
          token: newToken,
          distance: Math.round(distance * 100) / 100,
        });
      } else {
        // Challenge completed
        const completionTime = Date.now() - session.startTime;
        setSession(sessionId, session);

        res.status(200).json({
          success: true,
          key: hashKey(riddleData.key),
          completed: true,
          completionTime,
          message:
            "Congratulations! You have completed the Campus CTF Challenge!",
        });
      }
    } else {
      // Incorrect location
      setSession(sessionId, session);

      res.status(200).json({
        success: false,
        distance: Math.round(distance * 100) / 100,
        attemptsLeft: maxAttempts - session.attempts[currentRiddleNumber],
        message: `You are ${Math.round(
          distance
        )}m away from the target location`,
      });
    }
  } catch (error) {
    console.error("Verify location error:", error);
    res
      .status(500)
      .json({ error: "Failed to verify location: " + error.message });
  }
}
