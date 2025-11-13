// routes/currencieRoute.js
import express from "express";
import pool from "../config/db.js";
import verifyToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// simple cache for column existence checks (kept for backward-compatibility)
const _colCache = new Map();
async function hasColumn(col) {
  if (_colCache.has(col)) return _colCache.get(col);
  const q = `
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = $1
    LIMIT 1
  `;
  const r = await pool.query(q, [col]);
  const exists = r.rowCount > 0;
  _colCache.set(col, exists);
  return exists;
}

function getReqUserId(req) {
  return req.user?.user_id ?? req.user?.id ?? null;
}

/**
 * NOTE: Global mode — ignore user_id column even if it exists.
 * All endpoints below operate on global currencies (one row per code).
 */

// GET /api/currencies  (global)
router.get("/", verifyToken, async (req, res) => {
  try {
    const sql = "SELECT code, name, rate_to_inr, is_default FROM currencies ORDER BY is_default DESC, code";
    const result = await pool.query(sql);
    return res.json({ currencies: result.rows });
  } catch (error) {
    console.error("Fetch currencies error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/currencies  (global mode)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { code, name, rate_to_inr } = req.body;
    let { is_default = false, force = false } = req.body;

    if (!code || !name || rate_to_inr == null) {
      return res.status(400).json({ error: "code, name and rate_to_inr are required" });
    }

    const codeUpper = String(code).trim().toUpperCase();
    const rateVal = Number(rate_to_inr);
    if (Number.isNaN(rateVal)) {
      return res.status(400).json({ error: "rate_to_inr must be a number" });
    }
    is_default = Boolean(is_default);
    force = Boolean(force);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // If new currency must be default, clear previous global default
      if (is_default) {
        await client.query("UPDATE currencies SET is_default = false");
      }

      // Check if currency exists
      const existsRes = await client.query(
        "SELECT code, name, rate_to_inr, is_default FROM currencies WHERE code = $1 LIMIT 1",
        [codeUpper]
      );

      // If exists and not forcing -> return existing
      if (existsRes.rowCount > 0 && !force) {
        await client.query("COMMIT");
        return res.status(200).json({ currency: existsRes.rows[0], message: "Currency already exists" });
      }

      let result;
      if (existsRes.rowCount > 0 && force) {
        // Update existing (force)
        const hasUpdated = await hasColumn("updated_at");
        const updateSql = `
          UPDATE currencies
          SET name = $1, rate_to_inr = $2, is_default = $3${hasUpdated ? ", updated_at = NOW()" : ""}
          WHERE code = $4
          RETURNING code, name, rate_to_inr, is_default
        `;
        const updateParams = [name, rateVal, is_default, codeUpper];
        result = await client.query(updateSql, updateParams);
      } else {
        // Insert new (global - do NOT include user_id)
        const hasCreated = await hasColumn("created_at");
        const hasUpdated = await hasColumn("updated_at");

        const cols = ["code", "name", "rate_to_inr", "is_default"];
        const vals = [codeUpper, name, rateVal, is_default];

        if (hasCreated) { cols.push("created_at"); vals.push(new Date()); }
        if (hasUpdated) { cols.push("updated_at"); vals.push(new Date()); }

        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
        const insertSql = `
          INSERT INTO currencies (${cols.join(", ")})
          VALUES (${placeholders})
          ON CONFLICT (code) DO NOTHING
          RETURNING code, name, rate_to_inr, is_default
        `;
        result = await client.query(insertSql, vals);

        // If insert returned empty rows, it means conflict (already existed)
        if (result.rowCount === 0) {
          const getRes = await client.query("SELECT code, name, rate_to_inr, is_default FROM currencies WHERE code = $1", [codeUpper]);
          await client.query("COMMIT");
          return res.status(200).json({ currency: getRes.rows[0], message: "Currency already exists" });
        }
      }

      await client.query("COMMIT");
      return res.status(existsRes.rowCount > 0 ? 200 : 201).json({ currency: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create currency error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/currencies/default  (global)
router.put("/default", verifyToken, async (req, res) => {
  try {
    const { currency_code } = req.body;
    if (!currency_code) return res.status(400).json({ error: "currency_code is required" });

    const hasUpdated = await hasColumn("updated_at");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // clear global default
      await client.query("UPDATE currencies SET is_default = false");

      // set requested currency as default
      const updateSql = `
        UPDATE currencies
        SET is_default = true${hasUpdated ? ", updated_at = NOW()" : ""}
        WHERE code = $1
        RETURNING code, name, rate_to_inr, is_default
      `;
      const params = [currency_code.toUpperCase()];
      const updateRes = await client.query(updateSql, params);

      if (updateRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Currency not found" });
      }

      await client.query("COMMIT");
      return res.json({ message: "Default currency updated", currency: updateRes.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Set default currency error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/currencies/:code  (global)
router.delete("/:code", verifyToken, async (req, res) => {
  try {
    const codeParam = (req.params.code || "").toUpperCase();

    const delSql = "DELETE FROM currencies WHERE code = $1 RETURNING code, name, rate_to_inr, is_default";
    const delRes = await pool.query(delSql, [codeParam]);

    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: "Currency not found or not allowed to delete" });
    }
    return res.json({ message: "Currency deleted", currency: delRes.rows[0] });
  } catch (error) {
    console.error("Delete currency error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
