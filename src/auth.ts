import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { config } from "./config";
import type { AuthUser } from "./types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Reads a Bearer JWT and returns the user it belongs to. The Next.js client
 * mints this token from the Better Auth session (see `app/api/auth/token`),
 * so the API never has to touch session cookies directly.
 */
export function readUser(req: Request): AuthUser | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    const id = payload.sub ?? payload.id;
    const email = payload.email;
    const name = payload.name;

    if (typeof id !== "string" || typeof email !== "string") return null;

    return {
      id,
      email,
      name: typeof name === "string" && name.trim() ? name : email.split("@")[0],
    };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = readUser(req);

  if (!user) {
    res.status(401).json({ message: "Please sign in to continue." });
    return;
  }

  req.user = user;
  next();
}

export function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw new Error("requireAuth middleware missing on this route");
  }
  return req.user;
}
