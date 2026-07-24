// routes/transactions.js
import express from "express";
import multer from "multer";
import {
  addTransactionController,
  getTransactionsController,
  deleteTransactionController,
  importTransactionsController,
  updateTransactionController,
  deleteAllTransactionsController,
  deleteMultipleTransactionsController
} from "../controllers/transactionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.post("/", authMiddleware, addTransactionController);
router.get("/", authMiddleware, getTransactionsController);

// POST /api/transactions/import (supports JSON body or multipart/form-data file upload)
router.post("/import", authMiddleware, upload.single("file"), importTransactionsController);
router.delete("/all", authMiddleware, deleteAllTransactionsController);
router.post("/delete-multiple", authMiddleware, deleteMultipleTransactionsController);
router.delete("/:id", authMiddleware, deleteTransactionController);
router.put("/:id", authMiddleware, updateTransactionController);

export default router;

