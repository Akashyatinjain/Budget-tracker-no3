import pool from './config/db.js';

async function run() {
  try {
    console.log("Connecting to PostgreSQL pool...");
    const res = await pool.query("SELECT NOW()");
    console.log("Query response from DB:", res.rows);
    
    // Also print users count
    const users = await pool.query("SELECT COUNT(*) FROM users");
    console.log("Total users count in DB:", users.rows[0]);
  } catch (err) {
    console.error("Database check failed:", err);
  } finally {
    await pool.end();
  }
}

run();
