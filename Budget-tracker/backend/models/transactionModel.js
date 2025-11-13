import pool from "../config/db.js"; // PostgreSQL connection pool

// ✅ Add Transaction
export const addTransaction = async (userId, merchant, amount, category_id, type, transaction_date, description, currency = "INR") => {
  const query = `
    INSERT INTO transactions 
    (user_id, merchant, amount, category_id, type, transaction_date, description, currency, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *;
  `;
  const values = [userId, merchant, amount, category_id, type, transaction_date, description, currency];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// ✅ Get All Transactions
export const getTransactions = async (userId) => {
  const query = `
  SELECT * FROM transactions
  WHERE user_id = $1
  ORDER BY transaction_date DESC;
`;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

// ✅ Delete Transaction
export const deleteTransaction = async (transactionId, userId = null) => {
  if (!transactionId) throw new Error("Missing transactionId for deleteTransaction");

  const query = userId
    ? `DELETE FROM transactions WHERE transaction_id = $1 AND user_id = $2 RETURNING *;`
    : `DELETE FROM transactions WHERE transaction_id = $1 RETURNING *;`;

  const values = userId ? [transactionId, userId] : [transactionId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateTransaction = async (transactionId, fields = {}, userId = null) => {
  if (!transactionId) throw new Error("Missing transactionId for updateTransaction");

  const allowed = ["merchant","category_id","type","amount","currency","transaction_date","description"];
  const setParts = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      // cast amount to numeric if provided
      if (key === "amount" && fields[key] !== null && fields[key] !== undefined && fields[key] !== "") {
        // ensure numeric
        const num = Number(fields[key]);
        if (!Number.isFinite(num)) throw new Error("Invalid amount value");
        setParts.push(`${key} = $${idx}`);
        values.push(num);
      } else {
        setParts.push(`${key} = $${idx}`);
        values.push(fields[key]);
      }
      idx++;
    }
  }

  if (setParts.length === 0) throw new Error("No fields provided for update");

  setParts.push(`updated_at = NOW()`);

  let query;
  if (userId) {
    query = `UPDATE transactions SET ${setParts.join(", ")} WHERE transaction_id = $${idx} AND user_id = $${idx + 1} RETURNING *;`;
    values.push(transactionId, userId);
  } else {
    query = `UPDATE transactions SET ${setParts.join(", ")} WHERE transaction_id = $${idx} RETURNING *;`;
    values.push(transactionId);
  }

  console.debug("[SQL] updateTransaction:", query, "values:", values);
  const result = await pool.query(query, values);
  return result.rows[0] || null;
};