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
export const deleteTransaction = async (id) => {
  const query = `DELETE FROM transactions WHERE id = $1 RETURNING *;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};
