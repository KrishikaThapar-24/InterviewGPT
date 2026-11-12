import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from environment variables.");
  }

  return secret;
}

export function protect(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string"
    ) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    req.userId = decoded.sub;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
}
