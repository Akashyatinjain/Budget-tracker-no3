import express from "express";
import { getAIChatResponse } from "../controllers/aiController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/ai/chat
router.post("/chat", authMiddleware, getAIChatResponse);

export default router;
