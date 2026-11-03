import app from "./app";
import { config } from "./config";
import { ensureIndexes } from "./db";

async function start() {
  try {
    await ensureIndexes();
    console.log("[booknook-api] connected to MongoDB");
  } catch (error) {
    console.error("[booknook-api] could not initialise MongoDB", error);
    console.error("[booknook-api] set MONGODB_URI in server/.env and restart");
  }

  app.listen(config.port, () => {
    console.log(`[booknook-api] listening on http://localhost:${config.port}`);
  });
}

void start();
