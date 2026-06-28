// TransactionPage.jsx - FinTrack Theme
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { 
  FiPlus, FiSearch, FiFilter, FiX, FiEdit2, FiTrash2, 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiZap, FiShield 
} from "react-icons/fi";
import { useAuth, api } from "../context/AuthContext";

const TransactionPage = () => {
  const { user, token } = useAuth();
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

  const categories = [
    { id: 1, name: "Food & Dining", color: "#10b981" },
    { id: 2, name: "Shopping", color: "#8b5cf6" },
    { id: 3, name: "Transportation", color: "#06b6d4" },
    { id: 4, name: "Entertainment", color: "#eab308" },
    { id: 5, name: "Bills & Utilities", color: "#14b8a6" },
    { id: 6, name: "Healthcare", color: "#ef4444" },
    { id: 7, name: "Salary", color: "#22c55e" },
    { id: 8, name: "Investment", color: "#3b82f6" },
  ];

  const getCategoryName = (id) => {
    const cat = categories.find((c) => String(c.id) === String(id));
    return cat ? cat.name : "Unknown";
  };

  const getCategoryColor = (id) => {
    const cat = categories.find((c) => String(c.id) === String(id));
    return cat ? cat.color : "#6b7280";
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
    fetchTransactions();
  }, [token]);

  useEffect(() => {
    document.body.style.overflow =
      mobileSidebarOpen || showModal || showEditModal ? "hidden" : "auto";
  }, [mobileSidebarOpen, showModal, showEditModal]);

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await api.get("/api/transactions");
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
      await api.post("/api/transactions", newTransaction);
      toast.success("Transaction added successfully!");
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
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to add transaction.");
    }
  };

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
    if (!Number.isFinite(id)) return;

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
      await api.put(`/api/transactions/${id}`, payload);
      toast.success("Transaction updated!");
      await fetchTransactions();
      setShowEditModal(false);
      setEditTransaction(null);
    } catch (err) {
      console.error("Update transaction error:", err);
      toast.error("Failed to update transaction.");
    }
  };

  const handleDeleteTransaction = async (id) => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    try {
      await api.delete(`/api/transactions/${numericId}`);
      toast.success("Transaction deleted!");
      setTransactions((prev) => prev.filter((t) => (t.transaction_id ?? t.id) !== numericId));
      await fetchTransactions();
    } catch (err) {
      console.error("Delete transaction error:", err);
      toast.error("Failed to delete transaction.");
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

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date)) return "-";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden">
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 sm:p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Transactions</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  <FiZap className="w-3 h-3" />
                  AI Insights Active
                </span>
              </div>
              <p className="text-gray-400 text-sm">Manage your income and expenses efficiently</p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-5 py-2.5 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Add Transaction
            </button>
          </motion.div>

          {/* AI Insight Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <FiDollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Transaction Summary</p>
                <p className="text-xs text-gray-400">
                  {safeTransactions.length} total transactions · {totalIncome > totalExpenses ? '💰' : '📊'} 
                  Net savings: ₹{Math.abs(totalBalance).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FiShield className="w-3 h-3 text-emerald-400" />
                Secure
              </span>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Net Worth", value: totalBalance, color: "text-emerald-400", icon: FiTrendingUp },
              { title: "Total Income", value: totalIncome, color: "text-green-400", icon: FiTrendingUp },
              { title: "Total Expenses", value: totalExpenses, color: "text-rose-400", icon: FiTrendingDown },
              { title: "Transactions", value: safeTransactions.length, color: "text-teal-400", icon: FiDollarSign },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-5 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{item.title}</p>
                    <h2 className={`text-xl sm:text-2xl font-bold mt-1 ${item.color}`}>
                      ₹{Number(item.value || 0).toLocaleString("en-IN")}
                    </h2>
                  </div>
                  <div className={`p-2 rounded-lg ${item.color.replace('text', 'bg')}/20`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-3 sm:p-4 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="min-w-[120px] p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="min-w-[160px] p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="relative min-w-[160px] flex-1 sm:flex-none">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search merchant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                />
              </div>
            </div>

            <button
              onClick={() => { setFilter("all"); setCategoryFilter("all"); setSearchQuery(""); }}
              className="px-4 py-2 text-sm rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center gap-2"
            >
              <FiFilter className="w-4 h-4" />
              Clear Filters
            </button>
          </div>

          {/* Transactions Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg"
          >
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="py-3.5 px-4 text-left font-medium">Merchant</th>
                    <th className="py-3.5 px-4 text-left font-medium">Category</th>
                    <th className="py-3.5 px-4 text-left font-medium">Date</th>
                    <th className="py-3.5 px-4 text-left font-medium">Type</th>
                    <th className="py-3.5 px-4 text-right font-medium">Amount</th>
                    <th className="py-3.5 px-4 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t, index) => {
                      const id = t.transaction_id ?? t.id ?? Math.random();
                      return (
                        <motion.tr
                          key={id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-white/5 transition"
                        >
                          <td className="py-3.5 px-4 font-medium text-white">{t.merchant || "-"}</td>
                          <td className="py-3.5 px-4">
                            <span 
                              className="px-2.5 py-1 rounded-full text-xs"
                              style={{ 
                                backgroundColor: `${getCategoryColor(t.category_id)}20`,
                                color: getCategoryColor(t.category_id)
                              }}
                            >
                              {getCategoryName(t.category_id)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap">{formatDate(t.transaction_date)}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs ${
                              t?.type === "income" 
                                ? "bg-green-500/20 text-green-400" 
                                : "bg-rose-500/20 text-rose-400"
                            }`}>
                              {t.type || "-"}
                            </span>
                          </td>
                          <td className={`py-3.5 px-4 font-semibold text-right whitespace-nowrap ${
                            t.type === "income" ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {t.type === "income" ? "+" : "-"}₹{Number(safeParseAmount(t.amount ?? t)).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditClick(t)}
                                className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(id)}
                                className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, index) => {
                  const id = t.transaction_id ?? t.id ?? Math.random();
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-sm text-white truncate">{t.merchant || "-"}</h3>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              t?.type === "income" 
                                ? "bg-green-500/20 text-green-400" 
                                : "bg-rose-500/20 text-rose-400"
                            }`}>
                              {t.type || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: `${getCategoryColor(t.category_id)}20`,
                                color: getCategoryColor(t.category_id)
                              }}
                            >
                              {getCategoryName(t.category_id)}
                            </span>
                            <span className="text-xs text-gray-500">• {formatDate(t.transaction_date)}</span>
                          </div>
                          {t.description && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{t.description}</p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className={`text-sm font-semibold whitespace-nowrap ${
                            t.type === "income" ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {t.type === "income" ? "+" : "-"}₹{Number(safeParseAmount(t.amount ?? t)).toLocaleString("en-IN")}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(t)}
                              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition"
                              title="Edit"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(id)}
                              className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition"
                              title="Delete"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No transactions found
                </div>
              )}
            </div>
          </motion.div>
        </main>

        {/* Add Transaction Modal - FinTrack Style */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Add New Transaction</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition"
                >
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Merchant"
                  value={newTransaction.merchant}
                  onChange={(e) => setNewTransaction({ ...newTransaction, merchant: e.target.value })}
                  required
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  />
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={newTransaction.transaction_date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  />
                  <select
                    value={newTransaction.category_id}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition resize-none"
                  rows={3}
                />

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-medium transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Add Transaction
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Transaction Modal - FinTrack Style */}
        {showEditModal && editTransaction && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Edit Transaction</h2>
                <button
                  onClick={() => { setShowEditModal(false); setEditTransaction(null); }}
                  className="p-2 hover:bg-white/10 rounded-xl transition"
                >
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleUpdateTransaction} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Merchant"
                  value={editTransaction.merchant}
                  onChange={(e) => setEditTransaction({ ...editTransaction, merchant: e.target.value })}
                  required
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={editTransaction.amount}
                    onChange={(e) => setEditTransaction({ ...editTransaction, amount: e.target.value })}
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  />
                  <select
                    value={editTransaction.type}
                    onChange={(e) => setEditTransaction({ ...editTransaction, type: e.target.value })}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={editTransaction.transaction_date}
                    onChange={(e) => setEditTransaction({ ...editTransaction, transaction_date: e.target.value })}
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  />
                  <select
                    value={editTransaction.category_id}
                    onChange={(e) => setEditTransaction({ ...editTransaction, category_id: e.target.value })}
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  placeholder="Description"
                  value={editTransaction.description}
                  onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition resize-none"
                  rows={3}
                />

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditTransaction(null); }}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-medium transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Update Transaction
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionPage;