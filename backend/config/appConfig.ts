import { CorsOptions } from "cors";
import rateLimit from "express-rate-limit";

export const PORT = Number(process.env.PORT) || 3000;
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const corsConfig: CorsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// Rate limiter for general public API endpoints
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 60 seconds." }
});

// Stricter rate limiter for expensive AI endpoints
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI query rate limit exceeded, falling back to neural synthesized memory." }
});
