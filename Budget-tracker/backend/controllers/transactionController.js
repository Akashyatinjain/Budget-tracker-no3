// controllers/transactionController.js
import pool from "../config/db.js";
import { addTransaction, getTransactions, deleteTransaction,updateTransaction  } from "../models/transactionModel.js";
import { checkBudgetsAndNotify } from "../utils/budgetNotifications.js";

// ✅ Add Transaction Controller
export const addTransactionController = async (req, res) => {
  try {
    const { merchant, amount, category_id, transaction_date, description, currency, type } = req.body;
    const userId = req.user?.id ?? req.user?.user_id; // support both shapes

    if (!merchant || !amount || !category_id || !transaction_date) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const newTransaction = await addTransaction(
      userId,
      merchant,
      amount,
      category_id,
      type,
      transaction_date,
      description,
      currency || "INR"
    );

    // Create a simple in-app notification for the new transaction (so UI shows immediate feedback)
    try {
      const title = `New transaction: ${merchant || description || "Transaction"}`;
      const message = `You spent ₹${Number(amount).toLocaleString("en-IN")} on ${merchant || description || "an item"}`;
      const notifRes = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, priority, action_url, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
        [userId, title, message, 'transaction', 'low', '/transactions']
      );
      console.log("Inserted txn notification:", notifRes.rows[0]);
    } catch (notifErr) {
      console.warn("Failed to insert transaction notification:", notifErr?.message || notifErr);
      // don't fail txn for this
    }

    // Call budget check to possibly create budget warning/exceeded notifications
    try {
      // newTransaction should be the inserted row returned by addTransaction
await checkBudgetsAndNotify(userId, newTransaction);
      console.log("checkBudgetsAndNotify ran for user:", userId);
    } catch (budgetErr) {
      console.warn("Budget notification failed:", budgetErr?.message || budgetErr);
    }

    // Return created transaction (keep original shape)
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Add Transaction Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Get Transactions Controller
export const getTransactionsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const transactions = await getTransactions(userId);
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Delete Transaction Controller

   export const deleteTransactionController = async (req, res) => {
  try {
    const rawId = req.params.id;
    const transactionId = Number.isFinite(Number(rawId)) ? parseInt(rawId, 10) : null;
    if (!transactionId) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const userId = req.user?.id ?? null; // requires auth middleware to run

    const deleted = await deleteTransaction(transactionId, userId);

    if (!deleted) {
      // If not deleted, check if row exists to decide 404 vs 403
      const existsRes = await pool.query(
        "SELECT user_id FROM transactions WHERE transaction_id = $1",
        [transactionId]
      );

      if (existsRes.rowCount === 0) {
        return res.status(404).json({ message: "Transaction not found" });
      } else {
        return res.status(403).json({ message: "Not authorized to delete this transaction" });
      }
    }

    return res.status(200).json({ message: "Transaction deleted successfully", transaction: deleted });
  } catch (error) {
    console.error("Delete Transaction Error:", error?.message || error, error?.stack || "");
    return res.status(500).json({ message: "Server Error", error: error?.message || null });
  }
};

// ✅ Import Transactions Controller
export const importTransactionsController = async (req, res) => {
  try {
    const { rows } = req.body;
    const userId = req.user?.id ?? null;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No data found in CSV" });
    }

    const allowedColumns = [
      "category_id",
      "transaction_type",
      "amount",
      "currency",
      "description",
      "merchant",
      "transaction_date"
    ];

    // Validate CSV headers (for each row keys)
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!allowedColumns.includes(key)) {
          return res.status(400).json({ message: `Invalid column in CSV: ${key}` });
        }
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertSql = `INSERT INTO transactions 
  (user_id, category_id, type, amount, currency, description, merchant, transaction_date, created_at, updated_at)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`;

      let inserted = 0;
      for (const row of rows) {
        await client.query(insertSql, [
          userId,
          row.category_id || null,
row.transaction_type || row.type || null,          row.amount || null,
          row.currency || null,
          row.description || null,
          row.merchant || null,
          row.transaction_date || null,
        ]);
        inserted++;
      }

      await client.query("COMMIT");
      return res.status(200).json({ message: "Transactions imported successfully", inserted });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("DB insert error:", err);
      return res.status(500).json({ message: "DB insert failed" });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Import Transactions Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const updateTransactionController = async (req, res) => {
  try {
    const rawId = req.params.id;
    const transactionId = Number.isFinite(Number(rawId)) ? parseInt(rawId, 10) : null;
    if (!transactionId) return res.status(400).json({ message: "Invalid transaction id" });

    const allowed = ["merchant","category_id","type","amount","currency","transaction_date","description"];
    const payload = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) payload[k] = req.body[k];
    }
    if (Object.keys(payload).length === 0) return res.status(400).json({ message: "No valid fields provided to update" });

    const userId = req.user?.id ?? null;

    console.info(`[UPDATE handler] called for id=${transactionId} by user=${userId} payload=`, payload);

    // Attempt update
    const updated = await updateTransaction(transactionId, payload, userId);

    if (!updated) {
      const existsRes = await pool.query("SELECT user_id FROM transactions WHERE transaction_id = $1", [transactionId]);
      if (existsRes.rowCount === 0) {
        console.warn(`[UPDATE] transaction not found: ${transactionId}`);
        return res.status(404).json({ message: "Transaction not found" });
      } else {
        console.warn(`[UPDATE] not authorized: user=${userId} on transaction=${transactionId}`);
        return res.status(403).json({ message: "Not authorized to update this transaction" });
      }
    }

    console.info(`[UPDATE] success transactionId=${transactionId}`);
    return res.status(200).json({ message: "Transaction updated successfully", transaction: updated });
  } catch (error) {
    // show full error for debugging
    console.error("Update Transaction Error:", error?.message || error, error?.stack || "");
    return res.status(500).json({ message: "Server Error", error: error?.message || "unknown" });
  }
};