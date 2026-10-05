import { Router } from "express";
import { executeNeuralLearn, executeAiScan, resolveTickerWithAi } from "../services/geminiService";
import { aiLimiter } from "../config/appConfig";

export const aiRouter = Router();

aiRouter.use(aiLimiter);

// 1. Neural Bot Learning Cycle
aiRouter.post("/neural-learn", async (req, res) => {
  const { globalState, spyData, existingMemory } = req.body;
  try {
    const result = await executeNeuralLearn(globalState, spyData, existingMemory);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Multimodal Technical Chart Pattern Scan
aiRouter.post("/scan", async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  try {
    const result = await executeAiScan(imageBase64, mimeType);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to scan image" });
  }
});

// 3. AI Ticker Resolution
aiRouter.post("/resolve-ticker", async (req, res) => {
  const { query } = req.body;
  try {
    const ticker = await resolveTickerWithAi(query);
    res.json({ ticker });
  } catch (error: any) {
    res.json({ ticker: null });
  }
});
