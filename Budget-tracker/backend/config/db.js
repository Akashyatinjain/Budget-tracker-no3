// backend/config/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // 🔥 FORCE IPv4 (THIS FIXES ENETUNREACH)
  family: 4,

  ssl: {
    rejectUnauthorized: false,
  },

  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected (IPv4 forced)");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error:", err);
});

export default pool;
