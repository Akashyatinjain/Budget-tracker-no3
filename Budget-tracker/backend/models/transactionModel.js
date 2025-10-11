// transactionModel.js
const pool = require('../db'); // your PostgreSQL pool connection

// 1️⃣ Get all transactions for a user
const getTransactionsByUser = async (user_id) => {
  const result = await pool.query(
    `SELECT t.*, c.name AS category_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = $1
     ORDER BY t.transaction_date DESC`,
    [user_id]
  );
  return result.rows;
};

// 2️⃣ Add a new transaction
const addTransaction = async (data) => {
  const {
    user_id,
    category_id,
    type,
    amount,
    currency,
    description,
    merchant,
    transaction_date
  } = data;

  const result = await pool.query(
    `INSERT INTO transactions
      (user_id, category_id, type, amount, currency, description, merchant, transaction_date, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
     RETURNING *`,
    [user_id, category_id, type, amount, currency, description, merchant, transaction_date]
  );
  return result.rows[0];
};

// 3️⃣ Update a transaction
const updateTransaction = async (id, data) => {
  const {
    category_id,
    type,
    amount,
    currency,
    description,
    merchant,
    transaction_date
  } = data;

  const result = await pool.query(
    `UPDATE transactions
     SET category_id = $1,
         type = $2,
         amount = $3,
         currency = $4,
         description = $5,
         merchant = $6,
         transaction_date = $7,
         updated_at = NOW()
     WHERE transaction_id = $8
     RETURNING *`,
    [category_id, type, amount, currency, description, merchant, transaction_date, id]
  );
  return result.rows[0];
};

// 4️⃣ Delete a transaction
const deleteTransaction = async (id) => {
  await pool.query(
    `DELETE FROM transactions WHERE transaction_id = $1`,
    [id]
  );
  return { message: 'Transaction deleted' };
};

module.exports = {
  getTransactionsByUser,
  addTransaction,
  updateTransaction,
  deleteTransaction
};
