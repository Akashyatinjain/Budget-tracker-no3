// backend/config/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : undefined,
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
      }
);

// ✅ Optional connection test
pool
  .connect()
  .then(() => console.log("✅ PostgreSQL connected successfully"))
  .catch((err) =>
    console.error("❌ Database connection error:", err.message)
  );

export default pool;  // ✅ Default export only
