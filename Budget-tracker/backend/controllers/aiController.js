import pool from "../config/db.js";

export const getAIChatResponse = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const userId = req.user?.id ?? req.user?.user_id;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your backend .env file to enable the AI assistant."
      });
    }

    // 1. Fetch user profile details
    const userRes = await pool.query(
      "SELECT username, email, first_name, last_name, currency FROM users WHERE user_id = $1",
      [userId]
    );
    const userProfile = userRes.rows[0] || {};

    // 2. Fetch categories
    const categoriesRes = await pool.query(
      "SELECT category_id, name, type FROM categories WHERE user_id = $1 OR user_id IS NULL",
      [userId]
    );
    const categories = categoriesRes.rows;

    // 3. Fetch budgets
    const budgetsRes = await pool.query(
      `SELECT b.budget_id, b.amount, b.month, b.description, c.name AS category_name
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.category_id
       WHERE b.user_id = $1`,
      [userId]
    );
    const budgets = budgetsRes.rows;

    // 4. Fetch subscriptions
    const subscriptionsRes = await pool.query(
      "SELECT name, amount, currency, billing_cycle, category, next_billing_date, status FROM subscriptions WHERE user_id = $1",
      [userId]
    );
    const subscriptions = subscriptionsRes.rows;

    // 5. Fetch friend loans
    const loansRes = await pool.query(
      "SELECT friend_name, amount, loan_date, is_returned, notes FROM friend_loans WHERE user_id = $1",
      [userId]
    );
    const loans = loansRes.rows;

    // 6. Fetch recent transactions (limit to 200 to keep context lean and responsive)
    let transactionsRes;
    try {
      transactionsRes = await pool.query(
        `SELECT t.transaction_id, t.type, t.amount, t.currency, t.description, t.merchant, t.transaction_date, c.name AS category_name
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = $1
         ORDER BY t.transaction_date DESC
         LIMIT 200`,
        [userId]
      );
    } catch (err) {
      console.warn("Fallback query for transactions since category join failed:", err.message);
      transactionsRes = await pool.query(
        `SELECT t.transaction_id, t.type, t.amount, t.currency, t.description, t.merchant, t.transaction_date
         FROM transactions t
         WHERE t.user_id = $1
         ORDER BY t.transaction_date DESC
         LIMIT 200`,
        [userId]
      );
    }
    const transactions = transactionsRes.rows;

    // Create prompt parameters
    const currentDateTime = new Date().toISOString();
    const systemPrompt = `You are a helpful, professional, and friendly AI financial assistant integrated into the 'Budget-tracker' website.
Your goal is to guide the user, analyze their financial data, and answer questions about their expenses, income, budgets, subscriptions, loans, and categories.

Here is the current date and time: ${currentDateTime} (User's timezone/local time).

Here is the user's actual database data:
---
Profile: ${JSON.stringify(userProfile)}
Categories: ${JSON.stringify(categories)}
Budgets: ${JSON.stringify(budgets)}
Active Subscriptions: ${JSON.stringify(subscriptions)}
Pending/All Friend Loans: ${JSON.stringify(loans)}
Recent Transactions (Last 200): ${JSON.stringify(transactions)}
---

Guidelines:
1. Always base your answers on the user's actual data. If data is missing (e.g. no transactions), kindly guide the user on how they can add them.
2. If they ask about budget limits, compare their actual transactions to their budget amounts.
3. Be concise and format your answers beautifully using clean Markdown (bold, lists, tables).
4. Use appropriate currency symbols (like ₹ for INR or $ for USD) based on user's preference or data.
5. If the user asks general financial advice, give sensible, simple, and safe advice, but relate it to their data if possible.
6. Speak as a companion who is watching their budget and helping them build wealth.`;

    // Map history to Gemini's format: [{ role: "user" | "model", parts: [{ text: string }] }]
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

    // Push the current user's message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Make the direct API request to Gemini 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error response:", errText);
      return res.status(502).json({ error: "Failed to communicate with Gemini API. Please check your network or key validity." });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    res.status(200).json({ reply: replyText });
  } catch (error) {
    next(error);
  }
};
