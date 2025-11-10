// backend/config/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

function masked(v) {
  if (!v) return v;
  if (v.length <= 8) return "••••";
  return v.slice(0, 4) + "••••" + v.slice(-4);
}

// DEBUG: print relevant envs (masked) so you can confirm they exist in runtime logs
console.log("DB config:",
  {
    DATABASE_URL: masked(process.env.DATABASE_URL),
    DB_HOST: process.env.DB_HOST ? masked(process.env.DB_HOST) : undefined,
    DB_USER: process.env.DB_USER ? masked(process.env.DB_USER) : undefined,
    DB_NAME: process.env.DB_NAME,
    DB_PORT: process.env.DB_PORT,
    NODE_ENV: process.env.NODE_ENV,
  }
);

// Build pool config
let poolConfig;
if (process.env.DATABASE_URL) {
  // When using a connection string (Heroku/Render/Atlas style)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    // enable SSL in production-like environments. Many PaaS require this.
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  };
} else {
  // local / explicit settings
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  };
}

const pool = new Pool(poolConfig);

// Optional: test connection but print full error stack so you can see root cause
(async () => {
  try {
    const client = await pool.connect();
    try {
      // tiny query to ensure DB is reachable
      await client.query("SELECT 1");
      console.log("✅ PostgreSQL connected successfully");
    } finally {
      client.release();
    }
  } catch (err) {
    // print full stack so we can diagnose (host unreachable, auth failed, etc.)
    console.error("❌ Database connection error:", err && err.stack ? err.stack : err);
    // NOTE: do NOT crash if you prefer the server to keep running; otherwise uncomment:
    // process.exit(1);
  }
})();

export default pool;
