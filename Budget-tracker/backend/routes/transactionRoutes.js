import express from "express";
import {
  addTransactionController,
  getTransactionsController,
  deleteTransactionController,
} from "../controllers/transactionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addTransactionController);
router.get("/", authMiddleware, getTransactionsController);
router.delete("/:id", authMiddleware, deleteTransactionController);


export default router;
