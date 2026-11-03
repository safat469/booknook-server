import "dotenv/config";

const origins = (process.env.CLIENT_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI?.trim() ?? "",
  dbName: process.env.MONGODB_DB?.trim() || "booknook",
  // The same value is configured on the Next.js client. A development fallback
  // keeps `npm run dev` usable before env files exist.
  jwtSecret:
    process.env.JWT_SECRET?.trim() ||
    "booknook-development-jwt-secret-change-me-0123456789",
  clientOrigins: origins,
};

export function assertDatabaseConfigured(): void {
  if (!config.mongoUri) {
    throw new Error(
      "MONGODB_URI is not set. Add your MongoDB Atlas connection string to server/.env",
    );
  }
}
