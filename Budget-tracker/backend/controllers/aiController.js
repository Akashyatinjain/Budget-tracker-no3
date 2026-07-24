import pool from "../config/db.js";

export const getAIChatResponse = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const userId = req.user?.id ?? req.user?.user_id;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }


    // 1. Fetch user profile details
    const userRes = await pool.query(
      "SELECT username, email, first_name, last_name, currency FROM users WHERE user_id = $1",
      [userId]
    );
    const userProfile = userRes.rows[0] || {};

    // 2. Fetch categories
    const categoriesRes = await pool.query(
      "SELECT category_id, name FROM categories"
    );
    const categories = categoriesRes.rows;

    // 3. Fetch budgets
    const budgetsRes = await pool.query(
      `SELECT b.*, c.name AS category_name
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.category_id
       WHERE b.user_id = $1`,
      [userId]
    );
    const budgets = budgetsRes.rows.map(row => ({
      ...row,
      budget_id: row.budget_id ?? row.id
    }));

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      const queryLower = message.toLowerCase();
      let replyText = "";

      if (queryLower.includes("budget") || queryLower.includes("exceed") || queryLower.includes("limit")) {
        if (budgets.length === 0) {
          replyText = "### 📂 Budget Summary\n\nYou haven't set up any budget limits yet! Go to the **Budgets** page to set category-wise limits so I can help you monitor them.";
        } else {
          replyText = "### 📊 Budget Analysis (Local Mode)\n\nHere are your current category budgets vs actual spending:\n\n";
          replyText += "| Category | Budget Limit | Actual Spent | Status |\n|---|---|---|---|\n";
          budgets.forEach(b => {
            const spent = transactions
              .filter(t => t.type === "expense" && t.category_name === b.category_name)
              .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
            const status = spent > parseFloat(b.amount) ? "🔴 Over budget!" : "🟢 Under budget";
            replyText += `| **${b.category_name || "Other"}** | ₹${Number(b.amount).toLocaleString("en-IN")} | ₹${spent.toLocaleString("en-IN")} | ${status} |\n`;
          });
        }
      } else if (queryLower.includes("subscription") || queryLower.includes("recurring") || queryLower.includes("active")) {
        if (subscriptions.length === 0) {
          replyText = "### 🔄 Subscriptions Summary\n\nNo active subscriptions found. You can add your recurring services (like Netflix, Spotify) on the **Subscriptions** page to track them.";
        } else {
          replyText = "### 🔄 Subscriptions Report (Local Mode)\n\nHere are your active recurring services:\n\n";
          replyText += "| Subscription | Amount | Cycle | Next Bill Date | Status |\n|---|---|---|---|---|\n";
          subscriptions.forEach(s => {
            const nextBill = s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString() : "N/A";
            replyText += `| **${s.name}** | ₹${Number(s.amount).toLocaleString("en-IN")} | ${s.billing_cycle} | ${nextBill} | \`${s.status}\` |\n`;
          });
        }
      } else if (queryLower.includes("loan") || queryLower.includes("friend") || queryLower.includes("borrow") || queryLower.includes("lend")) {
        if (loans.length === 0) {
          replyText = "### 💸 Loans & Debts\n\nNo pending friend loans found! You can keep track of money you lent or borrowed on the **Friend Loans** page.";
        } else {
          replyText = "### 💸 Friends Loans Summary (Local Mode)\n\nHere is the log of money lent or borrowed:\n\n";
          replyText += "| Friend | Amount | Date | Status | Notes |\n|---|---|---|---|---|\n";
          loans.forEach(l => {
            const status = l.is_returned ? "🟢 Returned" : "🔴 Pending repayment";
            const dateStr = l.loan_date ? new Date(l.loan_date).toLocaleDateString() : "N/A";
            replyText += `| **${l.friend_name}** | ₹${Number(l.amount).toLocaleString("en-IN")} | ${dateStr} | ${status} | ${l.notes || "-"} |\n`;
          });
        }
      } else if (queryLower.includes("spending") || queryLower.includes("summarize") || queryLower.includes("summary") || queryLower.includes("transaction")) {
        const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount || 0), 0);
        const balance = totalIncome - totalExpense;

        replyText = "### 📈 Financial Summary Report (Local Mode)\n\n";
        replyText += `Here is a high-level summary of your financial records:\n\n`;
        replyText += `- **Total Balance / Net Worth**: ${balance >= 0 ? "🟢" : "🔴"} ₹${balance.toLocaleString("en-IN")}\n`;
        replyText += `- **Total Earnings (Income)**: ₹${totalIncome.toLocaleString("en-IN")}\n`;
        replyText += `- **Total Spending (Expenses)**: ₹${totalExpense.toLocaleString("en-IN")}\n`;
        replyText += `- **Total Records**: ${transactions.length} transactions stored.\n\n`;

        if (transactions.length > 0) {
          replyText += "#### 🕒 Recent Transactions:\n";
          transactions.slice(0, 5).forEach(t => {
            const prefix = t.type === "income" ? "+" : "-";
            const dateStr = t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "N/A";
            replyText += `- **${t.merchant || t.description || "Transaction"}**: ${prefix}₹${Number(t.amount).toLocaleString("en-IN")} on ${dateStr} (\`${t.category_name || "Other"}\`)\n`;
          });
        }
      } else {
        replyText = `### 👋 Welcome to FinAI (Local Offline Mode)\n\n` +
          `Hello **${userProfile.first_name || userProfile.username || "User"}**! I see that the **GEMINI_API_KEY** is not configured in the backend environment.\n\n` +
          `But don't worry! I can still query your local data directly from the database to answer financial questions. Try asking me details about:\n\n` +
          `1. **Budgets**: *"Am I exceeding any budgets?"*\n` +
          `2. **Subscriptions**: *"What active subscriptions do I have?"*\n` +
          `3. **Loans**: *"Show me a list of friend loans."*\n` +
          `4. **Spending Summary**: *"Summarize my spending."*\n\n` +
          `*Admin Tip: To enable full chat intelligence and conversational answers, add a valid \`GEMINI_API_KEY\` to the backend \`.env\` file.*`;
      }

      return res.status(200).json({ reply: replyText });
    }

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

    // Filter history to ensure alternating user/model roles starting with user
    const contents = [];
    let expectedRole = "user";
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        const role = h.role === "user" ? "user" : "model";
        if (role === expectedRole) {
          contents.push({
            role,
            parts: [{ text: h.text }]
          });
          expectedRole = expectedRole === "user" ? "model" : "user";
        }
      });
    }

    if (expectedRole === "model" && contents.length > 0) {
      contents.pop();
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
