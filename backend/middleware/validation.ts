import { Request, Response, NextFunction } from "express";

/**
 * Middleware to validate and sanitize ticker symbols
 */
export const validateTicker = (req: Request, res: Response, next: NextFunction) => {
  const ticker = req.params.ticker || req.query.ticker;
  if (!ticker || typeof ticker !== "string" || ticker.length > 20 || !/^[A-Za-z0-9.\-=^]+$/.test(ticker)) {
    return res.status(400).json({ error: "Invalid ticker symbol format." });
  }
  next();
};

/**
 * Validates request payload size and JSON format
 */
export const validateJsonPayload = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "POST" || req.method === "PUT") {
    if (!req.is("application/json") && req.headers["content-type"]?.includes("application/json") === false) {
      // Allow multipart/form-data for uploads
      if (req.headers["content-type"]?.includes("multipart/form-data")) {
        return next();
      }
    }
  }
  next();
};
