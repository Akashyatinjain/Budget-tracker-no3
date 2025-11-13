// TransactionPage.jsx (Responsive: mobile/tablet/desktop)
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";

const TransactionPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    merchant: "",
    category_id: "",
    type: "expense",
    amount: "",
    currency: "INR",
    transaction_date: "",
    description: "",
  });
  const [editTransaction, setEditTransaction] = useState(null);
  const [user, setUser] = useState(null);

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const categories = [
    { id: 1, name: "Food & Dining" },
    { id: 2, name: "Shopping" },
    { id: 3, name: "Transportation" },
    { id: 4, name: "Entertainment" },
    { id: 5, name: "Bills & Utilities" },
    { id: 6, name: "Healthcare" },
    { id: 7, name: "Salary" },
    { id: 8, name: "Investment" },
  ];

  const getCategoryName = (id) => {
    const cat = categories.find((c) => String(c.id) === String(id));
    return cat ? cat.name : "Unknown";
  };

  const safeParseAmount = (val) => {
    if (val == null) return 0;
    const v = typeof val === "object" ? val.amount : val;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const normalizeTransactionsResponse = (resData) => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData.transactions)) return resData.transactions;
    if (Array.isArray(resData.data)) return resData.data;
    return [];
  };

  useEffect(() => {
    fetchUser();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Disable body scroll when sidebar/modals open
  useEffect(() => {
    document.body.style.overflow =
      mobileSidebarOpen || showModal || showEditModal ? "hidden" : "auto";
  }, [mobileSidebarOpen, showModal, showEditModal]);

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      setUser(res.data?.user || res.data || null);
    } catch (err) {
      console.error("Fetch user error:", err);
      setUser(null);
    }
  };

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/transactions`, axiosConfig);
      const list = normalizeTransactionsResponse(res.data);
      setTransactions(list);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setTransactions([]);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${VITE_BASE_URL}/api/transactions`, newTransaction, axiosConfig);
      await fetchTransactions();
      setShowModal(false);
      setNewTransaction({
        merchant: "",
        category_id: "",
        type: "expense",
        amount: "",
        currency: "INR",
        transaction_date: "",
        description: "",
      });
    } catch (err) {
      console.error("Add transaction error:", err);
    }
  };

  // ---------- EDIT ----------
  const handleEditClick = (t) => {
    const id = Number(t.transaction_id ?? t.id);
    setEditTransaction({
      id: Number.isFinite(id) ? id : null,
      merchant: t.merchant ?? "",
      category_id: t.category_id ?? "",
      type: t.type ?? "expense",
      amount: t.amount ?? "",
      currency: t.currency ?? "INR",
      transaction_date: t.transaction_date
        ? (typeof t.transaction_date === "string"
            ? t.transaction_date.split("T")[0]
            : new Date(t.transaction_date).toISOString().slice(0, 10))
        : "",
      description: t.description ?? "",
    });
    setShowEditModal(true);
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!editTransaction || !editTransaction.id) return;

    const id = Number(editTransaction.id);
    if (!Number.isFinite(id)) {
      console.error("Invalid transaction id for update:", editTransaction.id);
      return;
    }

    const payload = {
      merchant: editTransaction.merchant,
      amount: editTransaction.amount,
      category_id: editTransaction.category_id,
      type: editTransaction.type,
      transaction_date: editTransaction.transaction_date,
      description: editTransaction.description,
      currency: editTransaction.currency,
    };

    try {
      await axios.put(`${VITE_BASE_URL}/api/transactions/${id}`, payload, {
        ...axiosConfig,
        headers: { ...(axiosConfig.headers || {}), "Content-Type": "application/json" },
      });
      await fetchTransactions();
      setShowEditModal(false);
      setEditTransaction(null);
    } catch (err) {
      console.error("Update transaction error:", err);
    }
  };

  // ---------- DELETE ----------
  const handleDeleteTransaction = async (id) => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      console.error("Invalid id for delete:", id);
      return;
    }
    const ok = window.confirm("Are you sure you want to delete this transaction?");
    if (!ok) return;

    try {
      await axios.delete(`${VITE_BASE_URL}/api/transactions/${numericId}`, {
        ...axiosConfig,
        headers: { ...(axiosConfig.headers || {}), "Content-Type": "application/json" },
      });
      // optimistic update
      setTransactions((prev) => prev.filter((t) => (t.transaction_id ?? t.id) !== numericId));
      await fetchTransactions();
    } catch (err) {
      console.error("Delete transaction error:", err);
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const filteredTransactions = safeTransactions
    .filter((t) => {
      if (!t) return false;
      if (filter === "all") return true;
      const type = (t.type || "").toString().toLowerCase();
      return type === filter;
    })
    .filter((t) => {
      if (categoryFilter === "all") return true;
      return String(t.category_id) === String(categoryFilter);
    })
    .filter((t) => {
      const merchant = (t.merchant || "").toString().toLowerCase();
      return merchant.includes(searchQuery.toString().toLowerCase());
    });

  const totalBalance = safeTransactions.reduce((sum, t) => {
    const amt = safeParseAmount(t.amount ?? t);
    return (t?.type === "income") ? sum + amt : sum - amt;
  }, 0);

  const totalIncome = safeTransactions
    .filter((t) => (t?.type || "").toString().toLowerCase() === "income")
    .reduce((s, t) => s + safeParseAmount(t.amount ?? t), 0);

  const totalExpenses = safeTransactions
    .filter((t) => (t?.type || "").toString().toLowerCase() === "expense")
    .reduce((s, t) => s + safeParseAmount(t.amount ?? t), 0);

  const recent = [...filteredTransactions]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 5);

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date)) return "-";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100 overflow-hidden">
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 sm:p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header + CTA */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">Transactions</h1>
              <p className="text-gray-400 text-sm md:text-base">
                Manage your income and expenses efficiently
              </p>
            </div>

            <div className="w-full md:w-auto flex gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-800 transition-all duration-200 shadow-md"
              >
                + Add Transaction
              </button>
            </div>
          </div>

          {/* Stats (grid responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Balance", color: "text-purple-300", value: totalBalance },
              { title: "Total Income", color: "text-green-400", value: totalIncome },
              { title: "Total Expenses", color: "text-red-400", value: totalExpenses },
              { title: "Total Transactions", color: "text-indigo-400", value: safeTransactions.length },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 sm:p-5 shadow-md flex flex-col justify-center"
              >
                <p className="text-sm text-gray-400">{item.title}</p>
                <h2 className={`text-xl sm:text-2xl font-semibold mt-1 ${item.color}`}>
                  ₹{Number(item.value || 0).toLocaleString("en-IN")}
                </h2>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-[#14001f] border border-purple-800/40 p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="min-w-[120px] p-2 sm:p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="min-w-[160px] p-2 sm:p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="relative min-w-[160px] flex-1 sm:flex-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>

                <input
                  type="text"
                  placeholder="Search merchant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-[#1b0128] border border-purple-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setFilter("all"); setCategoryFilter("all"); setSearchQuery(""); }}
                className="px-3 py-2 text-sm rounded-lg border border-purple-700 text-gray-200 hover:bg-[#1b0128] transition"
                title="Clear filters"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Transactions: table on md+, cards on mobile */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl overflow-hidden shadow-md">
            {/* TABLE for md+ */}
            <div className="hidden md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-purple-950/50 text-purple-300 uppercase text-xs sm:text-sm">
                  <tr>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Merchant</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Category</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Date</th>
                    <th className="py-3 px-4 text-left whitespace-nowrap">Type</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Amount</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => {
                    const id = t.transaction_id ?? t.id ?? Math.random();
                    return (
                      <tr key={id} className="border-t border-purple-800/30 hover:bg-purple-900/20 transition">
                        <td className="py-3 px-4 break-words">{t.merchant || "-"}</td>
                        <td className="py-3 px-4 text-purple-300">{getCategoryName(t.category_id)}</td>
                        <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{formatDate(t.transaction_date)}</td>
                        <td className={`py-3 px-4 ${(t?.type === "income") ? "text-green-400" : "text-red-400"}`}>{t.type || "-"}</td>
                        <td className="py-3 px-4 font-semibold text-right whitespace-nowrap">{(t.type === "income" ? "+" : "-")}₹{Number(safeParseAmount(t.amount ?? t)).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(t)}
                              className="px-3 py-1 text-xs rounded-md border border-purple-700 text-gray-200 hover:bg-[#1b0128]"
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(id)}
                              className="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:opacity-90"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-6 text-gray-400">No transactions found.</div>
              )}
            </div>

            {/* CARD/LIST for mobile */}
            <div className="md:hidden divide-y divide-purple-800/30">
              {filteredTransactions.length === 0 && (
                <div className="text-center py-6 text-gray-400">No transactions found.</div>
              )}

              {filteredTransactions.map((t) => {
                const id = t.transaction_id ?? t.id ?? Math.random();
                return (
                  <div key={id} className="p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm truncate">{t.merchant || "-"}</h3>
                          <span className={`text-xs font-medium ${t?.type === "income" ? "text-green-400" : "text-red-400"}`}>{t.type || "-"}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{getCategoryName(t.category_id)} • {formatDate(t.transaction_date)}</p>
                        {t.description && <p className="text-xs text-gray-300 mt-2 line-clamp-3">{t.description}</p>}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm font-semibold whitespace-nowrap">{(t.type === "income" ? "+" : "-")}₹{Number(safeParseAmount(t.amount ?? t)).toLocaleString("en-IN")}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(t)}
                            className="px-3 py-1 text-xs rounded-md border border-purple-700 text-gray-200"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(id)}
                            className="px-3 py-1 text-xs rounded-md bg-red-600 text-white"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Add Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[11000] p-3">
            <div className="bg-[#1b0128] border border-purple-700/50 rounded-xl w-full max-w-lg p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-lg sm:text-xl font-semibold text-purple-300 mb-4">Add New Transaction</h2>
              <form onSubmit={handleAddTransaction} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Merchant"
                  value={newTransaction.merchant}
                  onChange={(e) => setNewTransaction({ ...newTransaction, merchant: e.target.value })}
                  required
                  className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    required
                    className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                  />
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                    className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newTransaction.transaction_date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                    required
                    className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                  />
                  <select
                    value={newTransaction.category_id}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                    required
                    className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <textarea
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200 resize-none"
                  rows={3}
                />

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-all">Cancel</button>
                  <button type="submit" className="w-full sm:w-auto px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white transition-all">Add Transaction</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editTransaction && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[11000] p-3">
            <div className="bg-[#1b0128] border border-purple-700/50 rounded-xl w-full max-w-lg p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-lg sm:text-xl font-semibold text-purple-300 mb-4">Edit Transaction</h2>
              <form onSubmit={handleUpdateTransaction} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Merchant"
                  value={editTransaction.merchant}
                  onChange={(e) => setEditTransaction({ ...editTransaction, merchant: e.target.value })}
                  required
                  className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={editTransaction.amount}
                    onChange={(e) => setEditTransaction({ ...editTransaction, amount: e.target.value })}
                    required
                    className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                  />
                  <select
                    value={editTransaction.type}
                    onChange={(e) => setEditTransaction({ ...editTransaction, type: e.target.value })}
                    className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={editTransaction.transaction_date}
                    onChange={(e) => setEditTransaction({ ...editTransaction, transaction_date: e.target.value })}
                    required
                    className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                  />
                  <select
                    value={editTransaction.category_id}
                    onChange={(e) => setEditTransaction({ ...editTransaction, category_id: e.target.value })}
                    required
                    className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <textarea
                  placeholder="Description"
                  value={editTransaction.description}
                  onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })}
                  className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200 resize-none"
                  rows={3}
                />

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                  <button type="button" onClick={() => { setShowEditModal(false); setEditTransaction(null); }} className="w-full sm:w-auto px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-all">Cancel</button>
                  <button type="submit" className="w-full sm:w-auto px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white transition-all">Update</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionPage;
