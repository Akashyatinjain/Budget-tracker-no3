// backend/config/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// ---------- ENV DEBUG (safe masking) ----------
function masked(v) {
  if (!v) return "(missing)";
  if (v.length <= 4) return v;
  return v.slice(0, 2) + "****" + v.slice(-2);
}

console.log("🔍 Environment check:");
console.log("  DATABASE_URL:", masked(process.env.DATABASE_URL));
console.log("  NODE_ENV:", process.env.NODE_ENV);

// ---------- VALIDATION ----------
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

// ---------- PG POOL CONFIG (SUPABASE + RENDER) ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // 🔥 REQUIRED for Supabase (fixes self-signed certificate error)
  ssl: {
    rejectUnauthorized: false,
  },

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ---------- EVENTS ----------
pool.on("connect", () => {
  console.log("✅ PostgreSQL connected successfully");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err.message);
});

// ---------- NON-BLOCKING PROBE ----------
(async () => {
  try {
    const client = await pool.connect();
    client.release();
    console.log("✅ DB probe successful");
  } catch (err) {
    console.warn("⚠️ DB probe failed (non-fatal):", err.message);
  }
})();

export default pool;
