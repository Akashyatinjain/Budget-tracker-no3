import pool from "../config/db.js";

// ✅ Create a new user
export const createUser = async ({ username, email, password }) => {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [username, email, password]
  );
  if (result.rows[0]) {
    const { password_hash, ...safeUser } = result.rows[0];
    return safeUser;
  }
  return null;
};

// ✅ Find user by email (for login)
export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

// Ensure all profile, avatar and role columns exist in PostgreSQL database
(async () => {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Asia/Kolkata';
    `);
  } catch (e) {
    console.warn("User table columns check warning:", e.message);
  }
})();

// ✅ Find user by ID
export const findUserById = async (user_id) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE user_id = $1`,
    [user_id]
  );
  if (result.rows[0]) {
    const { password_hash, ...safeUser } = result.rows[0];
    // Normalize avatar property
    safeUser.avatar_url = safeUser.avatar_url || safeUser.avatar || safeUser.profile_picture || null;
    return safeUser;
  }
  return null;
};

// ✅ Get all users
export const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT user_id, username, email, first_name, last_name, role, avatar_url, avatar, created_at FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

// ✅ Update user profile fields dynamically
export const updateUser = async (user_id, fields = {}) => {
  const allowed = ["username", "first_name", "last_name", "phone", "currency", "language", "timezone", "avatar_url", "avatar", "profile_picture"];
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
    RETURNING user_id, username, email, first_name, last_name, phone, currency, language, timezone, role, avatar_url, avatar, profile_picture, updated_at
  `;

  const result = await pool.query(query, values);
  const updatedUser = result.rows[0];
  if (updatedUser) {
    updatedUser.avatar_url = updatedUser.avatar_url || updatedUser.avatar || updatedUser.profile_picture || null;
  }
  return updatedUser;
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
