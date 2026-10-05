import { Router } from "express";

export const portfolioRouter = Router();

portfolioRouter.get("/data", (req, res) => {
  res.json({
    allocation: [
      { name: 'Technology', value: 35, color: '#10b981' },
      { name: 'Energy', value: 15, color: '#3b82f6' },
      { name: 'Healthcare', value: 20, color: '#f59e0b' },
      { name: 'Finance', value: 10, color: '#ef4444' },
      { name: 'Consumer', value: 12, color: '#8b5cf6' },
      { name: 'Industrials', value: 8, color: '#6366f1' }
    ],
    attribution: [
      { name: 'Selection Effect', value: 125 },
      { name: 'Allocation Effect', value: 45 },
      { name: 'Currency Effect', value: -12 },
      { name: 'Timing Effect', value: 28 }
    ],
    riskMetrics: {
      sharpeRatio: 1.84,
      sortinoRatio: 2.12,
      maxDrawdown: -8.45,
      beta: 0.92,
      alpha: 4.15,
      informationRatio: 1.15,
      treynorRatio: 12.4,
      trackingError: 3.2
    }
  });
});
