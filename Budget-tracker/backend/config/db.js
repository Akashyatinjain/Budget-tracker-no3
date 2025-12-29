// backend/config/db.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // 🔥 CRITICAL FIX FOR SUPABASE + PGBOUNCER
  ssl: {
    rejectUnauthorized: false,
    requestCert: true,
  },

  // 🔥 REQUIRED for PgBouncer
  statement_timeout: 0,
  query_timeout: 0,

  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;
