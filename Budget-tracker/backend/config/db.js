// backend/config/db.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: "db.tuvonxsygikbkzsjopkl.supabase.co", // direct DB host
  port: 5432,
  user: "postgres",
  password: process.env.DB_PASSWORD, // password yahin rakho
  database: "postgres",

  // 🔥 THIS IS THE REAL FIX
  family: 4, // FORCE IPv4 (pg ka option)

  ssl: {
    rejectUnauthorized: false,
  },

  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;
