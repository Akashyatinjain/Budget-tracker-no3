import dotenv from 'dotenv';
dotenv.config();
import pool from './config/db.js';
import { updateUser, findUserById } from './models/userModel.js';

async function test() {
  try {
    console.log("Testing DB connection and columns...");
    const res = await pool.query("SELECT user_id, username FROM users LIMIT 1");
    if (res.rows.length === 0) {
      console.log("No users found in DB!");
      process.exit(0);
    }
    const testUser = res.rows[0];
    console.log("Test User:", testUser);

    console.log("Attempting updateUser...");
    const updated = await updateUser(testUser.user_id, {
      avatar_url: "https://example.com/avatar.jpg",
      avatar: "https://example.com/avatar.jpg"
    });
    console.log("Update Success! User:", updated);
  } catch (err) {
    console.error("EXACT DB ERROR:", err);
  } finally {
    process.exit(0);
  }
}

test();
