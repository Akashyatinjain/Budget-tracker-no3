// backend/config/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

function masked(v) {
  if (!v) return "(missing)";
  if (v.length <= 4) return v;
  return v.slice(0, 2) + "****" + v.slice(-2);
}

console.log("🔍 Environment check:");
console.log("  DATABASE_URL:", masked(process.env.DATABASE_URL));
console.log("  DB_HOST:", masked(process.env.DB_HOST));
console.log("  DB_USER:", masked(process.env.DB_USER));
console.log("  DB_NAME:", process.env.DB_NAME);
console.log("  DB_PORT:", process.env.DB_PORT);
console.log("  DB_SSL:", process.env.DB_SSL);
console.log("  NODE_ENV:", process.env.NODE_ENV);

let poolConfig;

if (process.env.DATABASE_URL) {
  // Use connection string mode (Render, Heroku)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    // If DB_SSL env is "true" enable ssl with rejectUnauthorized:false for common PaaS setups
    ssl: process.env.DB_SSL === "false" ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10,
  };
  console.log("✅ Using CONNECTION_STRING mode (DATABASE_URL)");
} else if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
};

console.log("✅ Using CONNECTION_STRING mode (DATABASE_URL)");

} else {
  console.error("❌ No database configuration found. Set either DATABASE_URL or DB_HOST/DB_USER/DB_NAME");
  process.exit(1);
}

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected successfully");
});

// Try a non-blocking connection probe (doesn't crash the process on failure)
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
