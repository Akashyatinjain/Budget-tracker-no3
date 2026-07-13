import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import pool from "../config/db.js";

const router = express.Router();

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friend_loans (
        loan_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        friend_name VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        loan_date DATE NOT NULL,
        is_returned BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ PostgreSQL friend_loans table ensured successfully");
  } catch (err) {
    console.error("⚠️ PostgreSQL friend_loans table check failed:", err.message);
  }
})();

// 1. GET /api/friend-loans - Fetch all loans for the logged-in user
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
      return res.status(401).json({ error: "User authentication failed" });
    }

    const result = await pool.query(
      `SELECT * FROM friend_loans WHERE user_id = $1 ORDER BY loan_date DESC, created_at DESC`,
      [userId]
    );

    res.json({ loans: result.rows });
  } catch (err) {
    next(err);
  }
});

// 2. POST /api/friend-loans - Add a new friend loan entry
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
      return res.status(401).json({ error: "User authentication failed" });
    }

    const { friend_name, amount, loan_date, notes = "", is_returned = false } = req.body;

    if (!friend_name || !friend_name.trim()) {
      return res.status(400).json({ error: "Friend name is required" });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    if (!loan_date) {
      return res.status(400).json({ error: "Loan date is required" });
    }

    const result = await pool.query(
      `INSERT INTO friend_loans 
       (user_id, friend_name, amount, loan_date, is_returned, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [userId, friend_name.trim(), parsedAmount, loan_date, is_returned, notes]
    );

    res.status(201).json({ loan: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// 3. PUT /api/friend-loans/:id - Update loan details (e.g. mark returned)
router.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User authentication failed" });
    }

    const { friend_name, amount, loan_date, is_returned, notes } = req.body;

    // Check if the loan exists and belongs to the user
    const checkRes = await pool.query(
      `SELECT * FROM friend_loans WHERE loan_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Loan record not found" });
    }

    const allowed = ["friend_name", "amount", "loan_date", "is_returned", "notes"];
    const setParts = [];
    const values = [];
    let idx = 1;

    const fields = { friend_name, amount, loan_date, is_returned, notes };

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        if (key === "amount") {
          const num = Number(fields[key]);
          if (isNaN(num) || num <= 0) {
            return res.status(400).json({ error: "Amount must be a positive number" });
          }
          setParts.push(`${key} = $${idx}`);
          values.push(num);
        } else if (key === "friend_name") {
          if (!fields[key] || !fields[key].trim()) {
            return res.status(400).json({ error: "Friend name is required" });
          }
          setParts.push(`${key} = $${idx}`);
          values.push(fields[key].trim());
        } else {
          setParts.push(`${key} = $${idx}`);
          values.push(fields[key]);
        }
        idx++;
      }
    }

    if (setParts.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    setParts.push(`updated_at = NOW()`);
    values.push(id, userId);

    const updateQuery = `
      UPDATE friend_loans 
      SET ${setParts.join(", ")} 
      WHERE loan_id = $${idx} AND user_id = $${idx + 1} 
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    res.json({ loan: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// 4. DELETE /api/friend-loans/:id - Remove loan record
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.user_id || req.user.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User authentication failed" });
    }

    const result = await pool.query(
      `DELETE FROM friend_loans WHERE loan_id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan record not found" });
    }

    res.json({ message: "Loan entry deleted successfully", loan: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
