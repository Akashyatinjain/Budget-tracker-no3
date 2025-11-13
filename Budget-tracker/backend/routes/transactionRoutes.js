// routes/transactions.js
import express from "express";
import {
  addTransactionController,
  getTransactionsController,
  deleteTransactionController,
  importTransactionsController,
  updateTransactionController
} from "../controllers/transactionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addTransactionController);
router.get("/", authMiddleware, getTransactionsController);
router.delete("/:id", authMiddleware, deleteTransactionController);

// POST /api/transactions/import
router.post("/import", authMiddleware, importTransactionsController);
router.delete("/:id", authMiddleware, deleteTransactionController);
router.put("/:id", authMiddleware, updateTransactionController);

export default router;
