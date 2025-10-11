// src/models/userModel.js
import { pool } from "../config/db.js";

// ✅ Create a new user
export const createUser = async ({ name, email, password, role }) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, name, email, role, created_at`,
    [name, email, password, role || "user"]
  );
  return result.rows[0];
};

// ✅ Find user by email (for login)
export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

// ✅ Find user by ID
export const findUserById = async (user_id) => {
  const result = await pool.query(
    `SELECT user_id, name, email, role, created_at
     FROM users WHERE user_id = $1`,
    [user_id]
  );
  return result.rows[0];
};

// ✅ Get all users (admin only)
export const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

// ✅ Update user
export const updateUser = async (user_id, { name, email, role }) => {
  const result = await pool.query(
    `UPDATE users
     SET name = $1, email = $2, role = $3, updated_at = NOW()
     WHERE user_id = $4
     RETURNING user_id, name, email, role, updated_at`,
    [name, email, role, user_id]
  );
  return result.rows[0];
};

// ✅ Delete user
export const deleteUser = async (user_id) => {
  await pool.query(`DELETE FROM users WHERE user_id = $1`, [user_id]);
  return { message: "User deleted successfully" };
};
