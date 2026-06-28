import pool from "../config/db.js";

// ✅ Create a new user
export const createUser = async ({ username, email, password }) => {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING user_id, username, email, first_name, last_name, phone, currency, language, timezone, role, created_at`,
    [username, email, password]
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
    `SELECT user_id, username, email, first_name, last_name, phone, currency, language, timezone, role, created_at 
     FROM users 
     WHERE user_id = $1`,
    [user_id]
  );
  return result.rows[0];
};

// ✅ Get all users
export const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT user_id, username, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

// ✅ Update user profile fields dynamically
export const updateUser = async (user_id, fields = {}) => {
  const allowed = ["username", "first_name", "last_name", "phone", "currency", "language", "timezone"];
  const setParts = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] !== undefined) {
      setParts.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
  }

  if (setParts.length === 0) {
    return await findUserById(user_id);
  }

  setParts.push(`updated_at = NOW()`);
  values.push(user_id);

  const query = `
    UPDATE users
    SET ${setParts.join(", ")}
    WHERE user_id = $${idx}
    RETURNING user_id, username, email, first_name, last_name, phone, currency, language, timezone, role, updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

// ✅ Update user password
export const updateUserPassword = async (user_id, password_hash) => {
  const result = await pool.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2 RETURNING user_id`,
    [password_hash, user_id]
  );
  return result.rows[0];
};

// ✅ Delete user
export const deleteUser = async (user_id) => {
  await pool.query(`DELETE FROM users WHERE user_id = $1`, [user_id]);
  return { message: "User deleted successfully" };
};
