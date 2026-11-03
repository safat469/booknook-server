import cors from "cors";
import express, { type NextFunction, type Request, type Response, Router } from "express";

import { config } from "./config";
import { ensureIndexes } from "./db";
import { HttpError } from "./http-error";
import { booksRouter } from "./routes/books";
import { borrowsRouter } from "./routes/borrows";

export const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    // A Bearer JWT is used instead of cookies, so every origin is safe to allow.
    // Set CLIENT_ORIGINS to lock this down in production.
    origin: config.clientOrigins.length > 0 ? config.clientOrigins : true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86_400,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "BookNook API",
    status: "ok",
    routes: ["/books", "/books/:id", "/borrows"],
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Create indexes on first use. Serverless functions only run `index.ts` when
// started locally, so this cannot live in the listen callback alone.
app.use(async (_req, _res, next) => {
  try {
    await ensureIndexes();
    next();
  } catch (error) {
    next(error);
  }
});

const api = Router();
api.use("/books", booksRouter);
api.use("/borrows", borrowsRouter);

// The assignment documents `/books`; the client calls `/api/books`. Serving
// both keeps every documented route working.
app.use("/api", api);
app.use("/", api);

app.use((_req, res) => {
  res.status(404).json({ message: "That API route does not exist." });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ message: "The request body is not valid JSON." });
    return;
  }

  console.error("[booknook-api]", error);
  res.status(500).json({ message: "Something went wrong on the server. Please try again." });
});

export default app;
