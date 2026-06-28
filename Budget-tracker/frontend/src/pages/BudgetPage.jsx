// BudgetPage.jsx - FinTrack Theme
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth, api } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiDollarSign,
  FiPieChart,
  FiTarget,
  FiTrendingUp,
  FiTrendingDown,
  FiZap,
  FiShield,
  FiClock
} from "react-icons/fi";

const normalizeArrayResponse = (resData) => {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData.budgets)) return resData.budgets;
  if (Array.isArray(resData.transactions)) return resData.transactions;
  if (Array.isArray(resData.data)) return resData.data;
  return [];
};

const BudgetPage = () => {
  const { user, token } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [newBudget, setNewBudget] = useState({
    category_id: "",
    amount: "",
    month: new Date().toISOString().slice(0, 7),
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  const getCategoryName = (id) =>
    categories.find((c) => +c.id === +id)?.name || "Unknown";

  const getCategoryColor = (id) =>
    categories.find((c) => +c.id === +id)?.color || "#6b7280";

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    await Promise.all([fetchBudgets(), fetchTransactions()]);
    setLoading(false);
  };

  const fetchBudgets = async () => {
    if (!token) return;
    try {
      const res = await api.get("/api/budgets");
      const list = normalizeArrayResponse(res.data);
      setBudgets(list);
    } catch (err) {
      console.error("Fetch budgets error:", err);
      setBudgets([]);
    }
  };

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await api.get("/api/transactions");
      const list = normalizeArrayResponse(res.data);
      setTransactions(list);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setTransactions([]);
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/budgets", newBudget);
      toast.success("Budget added successfully!");
      await fetchBudgets();
      setShowModal(false);
      setNewBudget({
        category_id: "",
        amount: "",
        month: new Date().toISOString().slice(0, 7),
        description: "",
      });
    } catch (err) {
      console.error("Add budget error:", err.response?.data || err.message);
      const msg = err.response?.data?.error || "Failed to add budget.";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDeleteBudget = async (id) => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    try {
      await api.delete(`/api/budgets/${numericId}`);
      toast.success("Budget deleted!");
      await fetchBudgets();
    } catch (err) {
      console.error("Delete budget error:", err);
      toast.error("Failed to delete budget.");
    }
  };

  const calculateSpentAmount = (categoryId, month) =>
    transactions
      .filter(
        (t) =>
          t.transaction_date?.slice(0, 7) === month &&
          +t.category_id === +categoryId &&
          t.type === "expense"
      )
      .reduce((sum, t) => sum + safeAmount(t.amount), 0);

  const calculateProgress = (budgetAmount, spentAmount) => {
    const b = parseFloat(budgetAmount);
    const s = parseFloat(spentAmount);
    if (!Number.isFinite(b) || b <= 0) return 0;
    return Math.min((s / b) * 100, 100);
  };

  const safeAmount = (val) => {
    const n = parseFloat(String(val).replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const getProgressColor = (p) =>
    p < 70 ? "bg-emerald-500" : p < 90 ? "bg-yellow-500" : "bg-rose-500";

  const getProgressTextColor = (p) =>
    p < 70 ? "text-emerald-400" : p < 90 ? "text-yellow-400" : "text-rose-400";

  const formatCurrency = (a) =>
    `₹${Number(a || 0).toLocaleString("en-IN")}`;

  const totalBudget = budgets.reduce((s, b) => s + +b.amount, 0);
  const totalSpent = budgets.reduce(
    (s, b) => s + calculateSpentAmount(b.category_id, b.month),
    0
  );
  const remainingBudget = totalBudget - totalSpent;
  const usedPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  useEffect(() => {
    if (!token) {
      setError("No authentication token found.");
      setLoading(false);
    } else {
      fetchAllData();
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen || showModal ? "hidden" : "auto";
  }, [mobileSidebarOpen, showModal]);

  if (loading)
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
        <AdvancedSidebar user={user} mobileOpen={mobileSidebarOpen} />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header onMobileToggle={() => setMobileSidebarOpen(true)} />
          <main className="p-4 mt-16 flex justify-center items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-3 text-emerald-400"
            >
              <FiPieChart className="w-6 h-6" />
              <span>Loading budgets...</span>
            </motion.div>
          </main>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
          >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Budget Management</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  <FiZap className="w-3 h-3" />
                  AI Insights Active
                </span>
              </div>
              <p className="text-gray-400 text-sm">Track and manage your monthly budgets</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchAllData}
                className="px-4 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-4 py-2.5 rounded-xl hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Add Budget
              </button>
            </div>
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
                <FiTarget className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Budget Summary</p>
                <p className="text-xs text-gray-400">
                  {budgets.length > 0 
                    ? `${budgets.length} active budgets · ${usedPercentage.toFixed(1)}% of total budget used`
                    : 'Create your first budget to start tracking'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FiShield className="w-3 h-3 text-emerald-400" />
                Secure
              </span>
              <span className="hidden sm:inline">
                <FiClock className="w-3 h-3 inline mr-1" />
                Real-time
              </span>
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-rose-400 font-medium">Error</p>
                  <p className="text-rose-300 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-rose-400 hover:text-rose-300"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                label: "Total Budget", 
                value: totalBudget, 
                color: "text-emerald-400",
                icon: FiDollarSign,
                bgColor: "bg-emerald-500/20"
              },
              { 
                label: "Total Spent", 
                value: totalSpent, 
                color: "text-rose-400",
                icon: FiTrendingDown,
                bgColor: "bg-rose-500/20"
              },
              {
                label: "Remaining",
                value: remainingBudget,
                color: remainingBudget >= 0 ? "text-emerald-400" : "text-rose-400",
                icon: FiTarget,
                bgColor: remainingBudget >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
              },
              { 
                label: "Active Budgets", 
                value: budgets.length, 
                color: "text-teal-400",
                icon: FiPieChart,
                bgColor: "bg-teal-500/20"
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <h2 className={`text-xl md:text-2xl font-bold mt-1 ${stat.color}`}>
                      {typeof stat.value === "number"
                        ? formatCurrency(stat.value)
                        : stat.value}
                    </h2>
                  </div>
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Overall Progress */}
          {budgets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Overall Budget Usage</span>
                <span className={`text-sm font-semibold ${getProgressTextColor(usedPercentage)}`}>
                  {usedPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(usedPercentage, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-2.5 rounded-full ${getProgressColor(usedPercentage)}`}
                />
              </div>
            </motion.div>
          )}

          {/* Budget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b, index) => {
              const spent = calculateSpentAmount(b.category_id, b.month);
              const progress = calculateProgress(b.amount, spent);
              const remaining = b.amount - spent;
              const categoryColor = getCategoryColor(b.category_id);

              return (
                <motion.div
                  key={b.budget_id || b.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg hover:border-emerald-500/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        <FiPieChart className="w-5 h-5" style={{ color: categoryColor }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {getCategoryName(b.category_id)}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {new Date(b.month + "-01").toLocaleDateString("en-IN", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBudget(b.budget_id || b.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete budget"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-400">
                        {formatCurrency(spent)} of {formatCurrency(b.amount)}
                      </span>
                      <span className={`font-medium ${getProgressTextColor(progress)}`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-2 rounded-full ${getProgressColor(progress)}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Budget</p>
                      <p className="text-white font-medium">{formatCurrency(b.amount)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Spent</p>
                      <p className="text-rose-400 font-medium">{formatCurrency(spent)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Left</p>
                      <p className={remaining >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                        {formatCurrency(Math.abs(remaining))}
                        {remaining < 0 && <span className="text-[10px] block text-rose-400">Over</span>}
                      </p>
                    </div>
                  </div>

                  {b.description && (
                    <p className="text-xs text-gray-500 mt-3 border-t border-white/5 pt-2">
                      {b.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {budgets.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-400 text-lg mb-2">No budgets set yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Create your first budget to start tracking your expenses
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-6 py-2.5 rounded-xl hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2 mx-auto"
              >
                <FiPlus className="w-4 h-4" />
                Create Your First Budget
              </button>
            </motion.div>
          )}
        </main>

        {/* Add Budget Modal - FinTrack Style */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111118] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4">Create New Budget</h2>

              <form onSubmit={handleAddBudget} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Category</label>
                  <select
                    value={newBudget.category_id}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, category_id: e.target.value })
                    }
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Amount</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newBudget.amount}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, amount: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Month</label>
                  <input
                    type="month"
                    value={newBudget.month}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, month: e.target.value })
                    }
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newBudget.description}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, description: e.target.value })
                    }
                    placeholder="Add a short description..."
                    rows={3}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-500/20"
                  >
                    Create Budget
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

export default BudgetPage;