import { Request, Response, NextFunction } from "express";

/**
 * Centralized API error handling middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error occurred.";

  if (process.env.NODE_ENV !== "production") {
    console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};
