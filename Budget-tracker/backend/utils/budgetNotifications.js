// utils/budgetNotifications.js
import pool from "../config/db.js";

/**
 * checkBudgetsAndNotify(userId, insertedOrBudgetObj)
 *
 * Behavior:
 * - If insertedOrBudgetObj looks like a transaction (has type/transaction_date/amount):
 *    -> compute currentSpent for relevant budgets, compute percentBefore/After and create notifications
 * - If insertedOrBudgetObj looks like a budget object (has amount/month and category_id):
 *    -> compute currentSpent in that budget period (for that month/period) and create immediate notifications
 *
 * Always creates in-app DB notifications. It will avoid duplicates via a short cooldown.
 */
// utils/budgetNotifications.js

/**
 * Simplified: only create "Budget Exceeded" notifications.
 * Handles both transaction flow and budget-create flow.
 */
export async function checkBudgetsAndNotify(userId, insertedObj) {
  try {
    console.log("[BUDGET] checkBudgetsAndNotify called:", { userId, insertedObj });

    const catParam = insertedObj && insertedObj.category_id ? (isNaN(Number(insertedObj.category_id)) ? null : Number(insertedObj.category_id)) : null;

    // Fetch budgets: if called from budget-create (has month & amount) find that exact budget,
    // otherwise find active budgets for the transaction category (or global).
    let budgetsRes;
    if (insertedObj && insertedObj.month && insertedObj.amount) {
      budgetsRes = await pool.query(
        `SELECT budget_id, user_id, amount, category_id, period_type, period_start_day, active, description, month
         FROM budgets
         WHERE user_id = $1
           AND (category_id IS NULL OR category_id = $2)
           AND month = $3
         ORDER BY budget_id DESC
         LIMIT 1`,
        [userId, catParam, String(insertedObj.month)]
      );
    } else {
      budgetsRes = await pool.query(
        `SELECT budget_id, user_id, amount, category_id, period_type, period_start_day, active, description, month
         FROM budgets
         WHERE user_id = $1 AND active = true
           AND (category_id IS NULL OR category_id = $2)`,
        [userId, catParam]
      );
    }

    const budgets = budgetsRes.rows || [];
    console.log("[BUDGET] budgets matched:", budgets.length);

    if (!budgets.length) return;

    // helper: compute period start/end (Date objects)
    const getPeriodRange = (b, txnDateStr) => {
      if (b.month) {
        const monthStr = String(b.month).slice(0, 7);
        const [y, m] = monthStr.split("-").map(Number);
        const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
        const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
        end.setMilliseconds(end.getMilliseconds() - 1);
        return { start, end };
      }
      const txnDate = txnDateStr ? new Date(txnDateStr) : new Date();
      if ((b.period_type || "monthly") === "weekly") {
        const day = txnDate.getDay();
        const diff = (day + 6) % 7;
        const start = new Date(txnDate);
        start.setDate(txnDate.getDate() - diff);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        end.setMilliseconds(end.getMilliseconds() - 1);
        return { start, end };
      }
      const day = b.period_start_day ? Number(b.period_start_day) : 1;
      const d = txnDate.getDate();
      let start = new Date(txnDate);
      if (d >= day) start.setDate(day);
      else { start.setMonth(start.getMonth() - 1); start.setDate(day); }
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);
      return { start, end };
    };

    for (const b of budgets) {
      try {
        const txnDateCandidate = insertedObj && insertedObj.transaction_date ? insertedObj.transaction_date : new Date().toISOString();
        const { start, end } = getPeriodRange(b, txnDateCandidate);

        const startDate = start.toISOString().slice(0, 10);
        const endDate = end.toISOString().slice(0, 10);

        console.log("[BUDGET] checking budget:", { budget_id: b.budget_id, startDate, endDate, category_id: b.category_id });

        // Sum expense transactions in the period (date-only comparison)
        const sumQ = `
          SELECT COALESCE(SUM(amount),0) as total
          FROM transactions
          WHERE user_id = $1
            AND type = 'expense'
            AND transaction_date::date >= $2::date
            AND transaction_date::date <= $3::date
            ${b.category_id ? "AND category_id = $4" : ""}
        `;
        const params = b.category_id ? [userId, startDate, endDate, b.category_id] : [userId, startDate, endDate];
        const sumRes = await pool.query(sumQ, params);
        const currentSpent = Number(sumRes.rows[0].total || 0);
        console.log("[BUDGET] currentSpent:", currentSpent);

        // Compute newSpent if transaction object present
        let newSpent = currentSpent;
        if (insertedObj && insertedObj.type === "expense") {
          const amt = Number(insertedObj.amount || 0);
          const txnDate = new Date(insertedObj.transaction_date || new Date().toISOString());
          const txnDateStr = txnDate.toISOString().slice(0,10);
          if (txnDateStr >= startDate && txnDateStr <= endDate) newSpent = currentSpent + amt;
        }

        const budgetAmount = Number(b.amount || insertedObj?.amount || 0);
        if (!budgetAmount || budgetAmount <= 0) {
          console.log("[BUDGET] invalid budget amount, skipping");
          continue;
        }

        const percentAfter = (newSpent / budgetAmount) * 100;
        console.log(`[BUDGET] percentAfter=${percentAfter.toFixed(2)} for budget_id=${b.budget_id}`);

        // dedupe only for transaction flow (budget-create should immediately notify if exceeded)
        let dedupeFound = false;
        if (!b.month) {
          const dedupeQ = `
            SELECT id FROM notifications
            WHERE user_id=$1 AND type='budget' AND (data->>'budget_id' = $2)
              AND created_at >= (NOW() - INTERVAL '12 hours')
            LIMIT 1
          `;
          const dedupeParams = [userId, String(b.budget_id || "")];
          const dedupeRes = await pool.query(dedupeQ, dedupeParams);
          dedupeFound = dedupeRes.rows.length > 0;
        }

        // Only create EXCEEDED notification (>=100%) when threshold met and not deduped
        if (percentAfter >= 100 && !dedupeFound) {
          const title = `Budget exceeded`;
          const message = `You have exceeded your budget of ₹${budgetAmount.toLocaleString("en-IN")}. Spent: ₹${newSpent.toLocaleString("en-IN")}.`;
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, priority, action_url, data, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
            [userId, title, message, "budget", "high", "/budgets", JSON.stringify({ budget_id: b.budget_id || null, month: b.month || null, percent: Math.round(percentAfter) })]
          );
          console.log("[BUDGET] inserted exceed notification for budget_id:", b.budget_id);
        } else {
          console.log("[BUDGET] no exceed notification (either <100% or deduped).");
        }
      } catch (innerErr) {
        console.warn("[BUDGET] inner error:", innerErr?.message || innerErr);
      }
    }

    console.log("[BUDGET] checkBudgetsAndNotify finished");
  } catch (err) {
    console.warn("[BUDGET] checkBudgetsAndNotify error:", err?.message || err);
  }
}
