// BudgetPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth, api } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Trash2,
  DollarSign,
  PieChart as PieChartIcon,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Clock,
  Sparkles,
  Wallet,
  AlertCircle,
  BarChart3
} from "lucide-react";

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
    { id: 1, name: "Food & Dining",    color: "#f43f5e", icon: "🍕" },
    { id: 2, name: "Shopping",         color: "#8b5cf6", icon: "🛍️" },
    { id: 3, name: "Transportation",   color: "#06b6d4", icon: "🚗" },
    { id: 4, name: "Entertainment",    color: "#f59e0b", icon: "🎬" },
    { id: 5, name: "Bills & Utilities",color: "#84cc16", icon: "💡" },
    { id: 6, name: "Healthcare",       color: "#ef4444", icon: "🏥" },
    { id: 7, name: "Salary",           color: "#22c55e", icon: "💰" },
    { id: 8, name: "Investment",       color: "#3b82f6", icon: "📈" },
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
      toast.success("✨ Budget added successfully!");
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
    p < 70 ? "from-emerald-400 to-teal-300" : p < 90 ? "from-yellow-400 to-orange-400" : "from-rose-400 to-red-400";

  const getProgressTextColor = (p) =>
    p < 70 ? "text-emerald-400" : p < 90 ? "text-yellow-400" : "text-rose-400";

  const getProgressBgColor = (p) =>
    p < 70 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : p < 90 ? "bg-gradient-to-r from-yellow-500 to-orange-400" : "bg-gradient-to-r from-rose-500 to-red-400";

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
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showModal]);

  // ====== Animation Variants ======
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  // ====== Stat Cards Data ======
  const statCards = [
    { 
      title: "Total Budget", value: totalBudget, 
      color: "from-emerald-400 to-teal-300", icon: DollarSign, 
      trend: "up", subtitle: "All categories",
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    { 
      title: "Total Spent", value: totalSpent, 
      color: "from-rose-400 to-red-300", icon: TrendingDown, 
      trend: "down", subtitle: `${usedPercentage.toFixed(1)}% used`,
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Remaining", value: remainingBudget, 
      color: remainingBudget >= 0 ? "from-emerald-400 to-teal-300" : "from-rose-400 to-red-300", 
      icon: Wallet, trend: remainingBudget >= 0 ? "up" : "down",
      subtitle: remainingBudget >= 0 ? "Available to spend" : "Over budget",
      bg: remainingBudget >= 0 ? "from-emerald-500/10 to-teal-500/5" : "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Active Budgets", value: budgets.length, 
      color: "from-purple-400 to-violet-300", icon: PieChartIcon, 
      trend: "up", subtitle: `${budgets.length} categories`,
      bg: "from-purple-500/10 to-violet-500/5"
    },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-[#030712] via-[#07101f] to-[#050816] text-white">

      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,.05),transparent_40%)]" />
      </div>

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/4 h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>
        <div className="absolute bottom-40 right-20 h-2 w-2 rounded-full bg-cyan-400 animate-ping"/>
        <div className="absolute top-72 right-1/3 h-3 w-3 rounded-full bg-teal-400 animate-pulse"/>
      </div>

      {/* Sidebar */}
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-8 mt-16 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">

          {/* Glow orbs */}
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[180px]" />
          <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[180px]" />

          {/* ====== Page Header ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-emerald-500/[0.03] backdrop-blur-2xl p-4 md:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Budget Management</h1>
                <p className="text-xs text-slate-400">Set spending limits. Track progress. Take control.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchAllData}
                className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 font-semibold text-xs text-slate-300 hover:text-white hover:border-emerald-500/30 transition-all flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-3.5 py-2 font-semibold text-xs text-white shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center gap-2"
              >
                <Plus size={14} />
                Add Budget
              </button>
            </div>
          </motion.div>

          {/* ====== Budget Summary Banner ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 shadow-lg hover:border-emerald-500/40 transition-all"
            whileHover={{ y: -1 }}
          >
            <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-emerald-500/20 blur-[40px]" />
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Budget Summary</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {budgets.length > 0 
                      ? `${budgets.length} active budgets · ${usedPercentage.toFixed(1)}% of total budget used`
                      : 'Create your first budget to start tracking your spending'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Secure
                </span>
                <span className="hidden sm:flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Real-time
                </span>
              </div>
            </div>
          </motion.div>

          {/* ====== Error Banner ====== */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-gradient-to-br from-rose-500/10 to-red-500/5 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-5 shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-400/20 to-red-400/20">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-400">Error</p>
                    <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError("")}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}

          {/* ====== Stat Cards ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 group`}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-300 font-medium">{stat.title}</p>
                    <h2 className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-1`}>
                      {typeof stat.value === "number" && stat.title !== "Active Budgets"
                        ? formatCurrency(stat.value)
                        : stat.value}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 shadow-lg`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.trend === "up" ? "text-emerald-400" :
                      stat.trend === "down" ? "text-rose-400" : "text-purple-400"
                    }`} />
                  </div>
                </div>
                
                {/* Trend indicator */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1">
                  <span className={`text-xs font-medium ${
                    stat.trend === "up" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {stat.trend === "up" ? "↑" : "↓"}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== Overall Progress Bar ====== */}
          {budgets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Overall Budget Usage</h3>
                <span className={`ml-auto text-sm font-semibold ${getProgressTextColor(usedPercentage)}`}>
                  {usedPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-[#1a2228] rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(usedPercentage, 100)}%` }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                  className={`h-full rounded-full ${getProgressBgColor(usedPercentage)}`}
                />
              </div>
              <div className="flex justify-between mt-3 text-xs text-slate-500">
                <span>Spent: {formatCurrency(totalSpent)}</span>
                <span>Budget: {formatCurrency(totalBudget)}</span>
              </div>
            </motion.div>
          )}

          {/* ====== Budget Cards Grid ====== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((b, index) => {
              const spent = calculateSpentAmount(b.category_id, b.month);
              const progress = calculateProgress(b.amount, spent);
              const remaining = b.amount - spent;
              const categoryColor = getCategoryColor(b.category_id);
              const categoryName = getCategoryName(b.category_id);
              const categoryData = categories.find(c => +c.id === +b.category_id);

              return (
                <motion.div
                  key={b.budget_id || b.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="relative overflow-hidden bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 group"
                  whileHover={{ y: -4, scale: 1.01 }}
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="p-3 rounded-xl flex-shrink-0 shadow-lg"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          <span className="text-lg">{categoryData?.icon || "📊"}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate">
                            {categoryName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {new Date(b.month + "-01").toLocaleDateString("en-IN", {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteBudget(b.budget_id || b.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex-shrink-0"
                        title="Delete budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">
                          {formatCurrency(spent)} <span className="text-slate-600">of</span> {formatCurrency(b.amount)}
                        </span>
                        <span className={`font-semibold ${getProgressTextColor(progress)}`}>
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#1a2228] rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                          className={`h-full rounded-full ${getProgressBgColor(progress)}`}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-3 text-center border border-white/5">
                        <p className="text-xs text-slate-500 mb-0.5">Budget</p>
                        <p className="text-white font-semibold text-sm">{formatCurrency(b.amount)}</p>
                      </div>
                      <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-3 text-center border border-white/5">
                        <p className="text-xs text-slate-500 mb-0.5">Spent</p>
                        <p className="text-rose-400 font-semibold text-sm">{formatCurrency(spent)}</p>
                      </div>
                      <div className="bg-white/[0.03] backdrop-blur-xl rounded-xl p-3 text-center border border-white/5">
                        <p className="text-xs text-slate-500 mb-0.5">Left</p>
                        <p className={`font-semibold text-sm ${remaining >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {formatCurrency(Math.abs(remaining))}
                        </p>
                        {remaining < 0 && (
                          <span className="text-[10px] text-rose-400 block">Over budget</span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {b.description && (
                      <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-white/5 leading-relaxed">
                        {b.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ====== Empty State ====== */}
          {budgets.length === 0 && !error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-12 shadow-lg"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 mb-6">
                  <Target className="w-16 h-16 text-emerald-400 opacity-40" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No budgets set yet</h3>
                <p className="text-slate-400 max-w-md mb-6">
                  Create your first budget to start tracking your expenses and take control of your finances.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowModal(true)}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-6 py-3 font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/60 transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create Your First Budget
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ====== Footer Branding ====== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-6 border-t border-white/10"
          >
            <p className="text-xs text-slate-500">
              <span className="text-emerald-400 font-medium">FinTrack</span> — Trusted by finance professionals across India
            </p>
          </motion.div>

        </main>

        {/* ====== Add Budget Modal ====== */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
               onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Create New Budget</h2>
              </div>

              <form onSubmit={handleAddBudget} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Category</label>
                  <select
                    value={newBudget.category_id}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, category_id: e.target.value })
                    }
                    required
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="" className="bg-[#0d141a]">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0d141a]">
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Amount (₹)</label>
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
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Month</label>
                  <input
                    type="month"
                    value={newBudget.month}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, month: e.target.value })
                    }
                    required
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">
                    Description <span className="text-slate-600">(Optional)</span>
                  </label>
                  <textarea
                    value={newBudget.description}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, description: e.target.value })
                    }
                    placeholder="Add a short description..."
                    rows={3}
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 hover:text-white hover:border-slate-400/30 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-5 py-3 font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/60 transition-all"
                  >
                    Create Budget
                  </motion.button>
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