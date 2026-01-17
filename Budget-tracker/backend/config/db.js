// // backend/config/db.js
// import pg from "pg";
// import dotenv from "dotenv";

// dotenv.config();
// const { Pool } = pg;

// const pool = new Pool({
//   host: "db.tuvonxsygikbkzsjopkl.supabase.co", // direct DB host
//   port: 5432,
//   user: "postgres",
//   password: process.env.DB_PASSWORD, // password yahin rakho
//   database: "postgres",

//   // 🔥 THIS IS THE REAL FIX
//   family: 4, // FORCE IPv4 (pg ka option)

//   ssl: {
//     rejectUnauthorized: false,
//   },

//   max: 5,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 10000,
// });

// export default pool;
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
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    family: 4,               // 🔥 ADD THIS
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10,
  };
  console.log("✅ Using CONNECTION_STRING mode (DATABASE_URL)");
}
else if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD || "",
    port: Number(process.env.DB_PORT || 5432),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10,
    family: 4,
  };
  console.log("✅ Using INDIVIDUAL VARS mode (DB_HOST, DB_USER, etc.)");
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
