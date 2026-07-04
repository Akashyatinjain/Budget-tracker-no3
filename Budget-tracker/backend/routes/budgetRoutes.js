// ...existing code...
import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import pool from "../config/db.js";
import { checkBudgetsAndNotify } from "../utils/budgetNotifications.js";

const router = express.Router();

// GET /api/budgets - list budgets
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query(
      "SELECT * FROM budgets WHERE user_id=$1 ORDER BY month DESC",
      [userId]
    );
    res.json({ budgets: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/budgets - create budget
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { category_id, amount, month, description } = req.body;

    // ----- 1) Check duplicate month/category budgets -----
    const dup = await pool.query(
      `SELECT * FROM budgets 
       WHERE user_id=$1 AND category_id=$2 AND month=$3`,
      [userId, category_id, month]
    );

    if (dup.rows.length > 0) {
      return res.status(400).json({ 
        error: "A budget already exists for this category & month" 
      });
    }

    // ----- 2) Create budget -----
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category_id, amount, month, description, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5, NOW(), NOW()) RETURNING *`,
      [userId, category_id, amount, month, description]
    );

    const newBudget = result.rows[0];

    // ----- 3) Send “budget created” notification -----
    try {
      await pool.query(
        `INSERT INTO notifications 
         (user_id, title, message, type, priority, action_url, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
        [
          userId,
          "Budget Created",
          `A budget of ₹${amount} has been created for month ${month}`,
          "budget",
          "low",
          "/budgets"
        ]
      );
    } catch (notifErr) {
      console.warn("Budget create notification failed:", notifErr);
    }

    try {
      console.log("[BUDGET] Running exceed check after budget creation...");
      await checkBudgetsAndNotify(userId, { category_id, amount, month });
    } catch (exErr) {
      console.warn("Budget exceed check failed:", exErr);
    }

    res.status(201).json({ budget: newBudget });

  } catch (err) {
    next(err);
  }
});

// DELETE /api/budgets/:id
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const result = await pool.query(
      "DELETE FROM budgets WHERE id=$1 AND user_id=$2",
      [id, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Budget not found" });
    }
    res.json({ msg: "Budget deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
