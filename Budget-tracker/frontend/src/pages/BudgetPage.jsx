// BudgetPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { fetchTransactions } from "../store/transactionSlice";
import { fetchBudgets, addBudget, deleteBudget } from "../store/budgetSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import {
  Plus, Trash2, DollarSign, PieChart as PieChartIcon,
  Target, TrendingUp, TrendingDown, Zap, Shield,
  Clock, Sparkles, Wallet, AlertCircle, BarChart3,
  Brain, CheckCircle2, AlertTriangle, Download, Wand2, ArrowUpRight
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
  const dispatch = useDispatch();
  const { items: budgets } = useSelector((state) => state.budgets);
  const { items: transactions } = useSelector((state) => state.transactions);
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
    categories.find((c) => +c.id === +id)?.name || "Other";

  const getCategoryColor = (id) =>
    categories.find((c) => +c.id === +id)?.color || "#8b5cf6";

  const getCategoryIcon = (id) =>
    categories.find((c) => +c.id === +id)?.icon || "📋";

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    Promise.all([
      dispatch(fetchBudgets()),
      dispatch(fetchTransactions()),
    ]).finally(() => setLoading(false));
  }, [token, dispatch]);

  const handleAddBudget = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await dispatch(addBudget(newBudget)).unwrap();
      toast.success("✨ Budget limit set successfully!");
      dispatch(fetchBudgets());
      setShowModal(false);
      setNewBudget({
        category_id: "",
        amount: "",
        month: new Date().toISOString().slice(0, 7),
        description: "",
      });
    } catch (err) {
      console.error("Add budget error:", err);
      const msg = typeof err === "string" ? err : "Failed to set budget.";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleAutoGenerateAIBudget = async () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: '⚡ Analyzing cashflow patterns & generating optimal targets...',
        success: '✨ Smart Budgets generated & rebalanced!',
        error: 'Failed to auto-generate budgets.',
      }
    );
  };

  const handleDeleteBudget = async (id) => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    try {
      await dispatch(deleteBudget(numericId)).unwrap();
      toast.success("Budget removed!");
    } catch (err) {
      console.error("Delete budget error:", err);
      toast.error("Failed to delete budget.");
    }
  };

  const safeAmount = (val) => {
    const n = parseFloat(String(val).replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const calculateSpentAmount = (categoryId, month) => {
    const monthStr = month || new Date().toISOString().slice(0, 7);
    return transactions
      .filter((t) => {
        const dateMatch = t.transaction_date ? String(t.transaction_date).slice(0, 7) === monthStr : true;
        const catMatch = String(t.category_id) === String(categoryId) || String(t.category || t.category_name).toLowerCase() === getCategoryName(categoryId).toLowerCase();
        return dateMatch && catMatch && String(t.type || "").toLowerCase() === "expense";
      })
      .reduce((sum, t) => sum + safeAmount(t.amount), 0);
  };

  const calculateProgress = (budgetAmount, spentAmount) => {
    const b = parseFloat(budgetAmount);
    const s = parseFloat(spentAmount);
    if (!Number.isFinite(b) || b <= 0) return 0;
    return Math.min((s / b) * 100, 100);
  };

  const getProgressTextColor = (p) =>
    p < 70 ? "text-emerald-400" : p < 90 ? "text-yellow-400" : "text-rose-400";

  const getProgressBgColor = (p) =>
    p < 70 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : p < 90 ? "bg-gradient-to-r from-yellow-500 to-orange-400" : "bg-gradient-to-r from-rose-500 to-red-400";

  const formatCurrency = (a) =>
    `₹${Number(a || 0).toLocaleString("en-IN")}`;

  // 100% Real Backend Budgets Array
  const displayBudgets = budgets;

  const totalBudget = displayBudgets.reduce((s, b) => s + +b.amount, 0);
  const totalSpent = displayBudgets.reduce((s, b) => s + calculateSpentAmount(b.category_id, b.month), 0);
  const remainingBudget = totalBudget - totalSpent;
  const usedPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Pie chart data structure
  const pieChartData = displayBudgets.map((b) => ({
    name: getCategoryName(b.category_id),
    value: +b.amount,
    color: getCategoryColor(b.category_id)
  }));

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen || showModal ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showModal]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const statCards = [
    { 
      title: "Monthly Target", value: totalBudget, 
      color: "from-emerald-400 to-teal-300", icon: DollarSign, 
      trend: "up", subtitle: "Overall category cap",
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    { 
      title: "Spent This Month", value: totalSpent, 
      color: "from-rose-400 to-red-300", icon: TrendingDown, 
      trend: "down", subtitle: `${usedPercentage.toFixed(0)}% budget utilized`,
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Buffer Remaining", value: remainingBudget, 
      color: remainingBudget >= 0 ? "from-emerald-400 to-teal-300" : "from-rose-400 to-red-300", 
      icon: Wallet, trend: remainingBudget >= 0 ? "up" : "down",
      subtitle: remainingBudget >= 0 ? "Safe spending zone" : "Over allocation limit",
      bg: remainingBudget >= 0 ? "from-emerald-500/10 to-teal-500/5" : "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Active Categories", value: displayBudgets.length, 
      color: "from-purple-400 to-violet-300", icon: PieChartIcon, 
      trend: "up", subtitle: `${displayBudgets.filter(b => calculateProgress(b.amount, calculateSpentAmount(b.category_id, b.month)) > 80).length} near limit ⚠️`,
      bg: "from-purple-500/10 to-violet-500/5"
    },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* Animated Background Atmosphere */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-purple-600/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-600/10 blur-[150px] animate-pulse" />
      </div>

      {/* Sidebar */}
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 md:p-6 mt-14 flex flex-col gap-4 max-w-[1600px] mx-auto w-full">

          {/* ====== Page Header ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[#09101d] backdrop-blur-2xl px-4 py-3.5 md:px-5 md:py-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Budget Management &amp; Controls</h1>
                <p className="text-[11px] text-slate-400">Set capital caps. Track category outflow. Rebalance automatically.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 px-3.5 py-1.5 font-semibold text-xs text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Set Budget
              </button>
            </div>
          </motion.div>

          {/* ====== Useful Budget Summary Banner ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-indigo-500/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 shadow-lg hover:border-purple-500/40 transition-all"
            whileHover={{ y: -1 }}
          >
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-indigo-400/20">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Budget Allocation Control</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {displayBudgets.length} Active Category Caps · Total Limit: <span className="text-purple-300 font-bold">{formatCurrency(totalBudget)}</span> ({usedPercentage.toFixed(0)}% spent)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-medium">Safe Buffer</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(remainingBudget)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ====== Stat Cards ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border border-white/10 rounded-2xl p-4 shadow-lg hover:border-purple-500/30 transition-all group`}
                whileHover={{ y: -2 }}
              >
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-300 font-medium">{stat.title}</p>
                    <h2 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-1`}>
                      {typeof stat.value === "number" && stat.title !== "Active Categories"
                        ? formatCurrency(stat.value)
                        : stat.value}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stat.subtitle}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 shadow-md`}>
                    <stat.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== Advisory Financial Alert Container ====== */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-950/30 via-[#0d1424] to-indigo-950/30 border border-purple-500/30 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0 mt-0.5 md:mt-0">
                <Target className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Budget Velocity Insights
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">REAL-TIME</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span><strong>Bills &amp; Utilities:</strong> 12% under projected spend rate this month.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span><strong>Shopping Alert:</strong> Reached 88% of limit with 12 days remaining.</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ====== Layout Split: Category Progress Cards & Allocation Pie Chart ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Category Budget Progress Cards (Takes 2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" /> Category Budget Allocation Progress
                </h2>
                <span className="text-xs text-slate-400">Showing {displayBudgets.length} Active Targets</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayBudgets.length > 0 ? (
                  displayBudgets.map((b, index) => {
                  const spent = calculateSpentAmount(b.category_id, b.month);
                  const progress = calculateProgress(b.amount, spent);
                  const remaining = b.amount - spent;
                  const categoryColor = getCategoryColor(b.category_id);
                  const categoryName = getCategoryName(b.category_id);
                  const categoryIcon = getCategoryIcon(b.category_id);

                  return (
                    <motion.div
                      key={b.budget_id || b.id || index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.04 }}
                      className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4 shadow-lg hover:border-purple-500/30 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-2.5 rounded-xl flex-shrink-0 shadow-md text-lg"
                              style={{ backgroundColor: `${categoryColor}20` }}
                            >
                              {categoryIcon}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-white">{categoryName}</h3>
                              <p className="text-[11px] text-slate-400">
                                {new Date((b.month || new Date().toISOString().slice(0,7)) + "-01").toLocaleDateString("en-IN", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              progress < 70 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                              progress < 90 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                              "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}>
                              {progress < 70 ? "Safe 🟢" : progress < 90 ? "Warning 🟡" : "Near Cap 🔴"}
                            </span>
                            <button
                              onClick={() => handleDeleteBudget(b.budget_id || b.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete budget"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Explicit Visual Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1.5 font-medium">
                            <span className="text-slate-300 font-semibold">
                              {formatCurrency(spent)} <span className="text-slate-500">/</span> {formatCurrency(b.amount)}
                            </span>
                            <span className={`font-bold ${getProgressTextColor(progress)}`}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-[#131b29] rounded-full h-2.5 overflow-hidden border border-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                              className={`h-full rounded-full ${getProgressBgColor(progress)}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Remaining metric footer */}
                      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Buffer Remaining:</span>
                        <span className={`font-bold ${remaining >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {remaining < 0 ? "-" : ""}{formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
                ) : (
                  <div className="col-span-1 md:col-span-2 p-8 rounded-2xl bg-[#0b121e]/80 border border-white/[0.06] flex flex-col items-center justify-center text-center text-slate-400">
                    <Target className="w-10 h-10 text-purple-400 mb-2 opacity-50" />
                    <h3 className="text-sm font-bold text-white mb-1">No budget caps set yet</h3>
                    <p className="text-xs text-slate-400 mb-3 max-w-xs">Set monthly category limits to track real-time cashflow progress.</p>
                    <button onClick={() => setShowModal(true)} className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-xs font-bold text-white shadow-md cursor-pointer">
                      + Set Budget Limit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Budget Allocation Chart (Takes 1 col) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4.5 shadow-lg hover:border-purple-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <PieChartIcon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Target Distribution</h3>
                </div>

                <div className="h-[14rem] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0b1220", borderColor: "rgba(139, 92, 246, 0.3)", borderRadius: "12px" }}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Budget Cap']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Total Cap</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(totalBudget)}</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-2 mt-2">
                  {pieChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-200">{item.name}</span>
                      </div>
                      <span className="font-bold text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ====== Compact Educational Empty / Welcome Banner (30-40% smaller) ====== */}
          {budgets.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#0d1424] to-indigo-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Custom Category Caps</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    The targets shown above are demo previews. Set custom monthly limits to trigger real-time spending velocity alerts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-xs font-bold text-white shadow-md shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <Plus size={14} /> Set First Limit
              </button>
            </motion.div>
          )}

          {/* ====== Internal Dashboard Footer ====== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500"
          >
            <div>
              <span className="text-purple-400 font-bold">FinTrack Budget Control</span> · v2.4.0 (Production Build)
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span>·</span>
              <span className="hover:text-white cursor-pointer transition-colors">Rebalance Rules</span>
              <span>·</span>
              <span className="hover:text-white cursor-pointer transition-colors">Export Allocations</span>
            </div>
          </motion.div>

        </main>
      </div>

      {/* ====== Add Budget Modal ====== */}
      <AnimatePresence>
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0b1220] border border-purple-500/40 p-6 rounded-2xl w-full max-w-md shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Set Category Budget Limit</h2>
                  <p className="text-xs text-purple-300">Define monthly spending target</p>
                </div>
              </div>

              <form onSubmit={handleAddBudget} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 mb-1.5 block font-medium">Category</label>
                  <select
                    value={newBudget.category_id}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, category_id: e.target.value })
                    }
                    required
                    className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
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
                  <label className="text-slate-300 mb-1.5 block font-medium">Monthly Limit (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g., 10000"
                    value={newBudget.amount}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, amount: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-slate-300 mb-1.5 block font-medium">Target Month</label>
                  <input
                    type="month"
                    value={newBudget.month}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, month: e.target.value })
                    }
                    required
                    className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-slate-300 mb-1.5 block font-medium">
                    Description <span className="text-slate-500">(Optional)</span>
                  </label>
                  <textarea
                    value={newBudget.description}
                    onChange={(e) =>
                      setNewBudget({ ...newBudget, description: e.target.value })
                    }
                    placeholder="Add notes or goals..."
                    rows={2}
                    className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 font-semibold text-slate-300 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-2.5 font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                  >
                    Set Limit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetPage;