// AnalyticsPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth, api } from "../context/AuthContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar, AreaChart, Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, PieChart as PieChartIcon, Calendar,
  BarChart3, Activity, Target, Award, ArrowUp, ArrowDown,
  Zap, Shield, Clock, Sparkles, Brain, X, CheckCircle2, DollarSign, Tag, CalendarDays
} from "lucide-react";

const AnalyticsPage = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [showAIModal, setShowAIModal] = useState(false);

  const categories = [
    { id: 1, name: "Food & Dining",    color: "#8b5cf6", icon: "🍕" },
    { id: 2, name: "Shopping",         color: "#ec4899", icon: "🛍️" },
    { id: 3, name: "Transportation",   color: "#06b6d4", icon: "🚗" },
    { id: 4, name: "Entertainment",    color: "#f59e0b", icon: "🎬" },
    { id: 5, name: "Bills & Utilities",color: "#6366f1", icon: "💡" },
    { id: 6, name: "Healthcare",       color: "#ef4444", icon: "🏥" },
    { id: 7, name: "Salary",           color: "#10b981", icon: "💰" },
    { id: 8, name: "Investment",       color: "#3b82f6", icon: "📈" },
  ];

  const safeAmount = (t) => {
    if (!t) return 0;
    const val = typeof t === "object" ? t.amount : t;
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await api.get("/api/transactions");
      const data = res.data.transactions || res.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch transactions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchTransactions();
  }, [token]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen || showAIModal ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showAIModal]);

  const getFilteredTransactions = () => {
    if (!Array.isArray(transactions)) return [];
    const now = new Date();
    const filterDate = new Date();
    switch (timeRange) {
      case "week":  filterDate.setDate(now.getDate() - 7); break;
      case "month": filterDate.setMonth(now.getMonth() - 1); break;
      case "year":  filterDate.setFullYear(now.getFullYear() - 1); break;
      default:      return transactions;
    }
    return transactions.filter((t) => {
      if (!t.transaction_date) return false;
      return new Date(t.transaction_date) >= filterDate;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  const totalIncome = filteredTransactions
    .filter((t) => String(t.type || "").toLowerCase() === "income")
    .reduce((sum, t) => sum + safeAmount(t), 0);

  const totalExpense = filteredTransactions
    .filter((t) => String(t.type || "").toLowerCase() === "expense")
    .reduce((sum, t) => sum + safeAmount(t), 0);

  const netSavings  = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const monthlyData = {};
  filteredTransactions.forEach((t) => {
    if (!t.transaction_date) return;
    const d = new Date(t.transaction_date);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!monthlyData[key]) {
      monthlyData[key] = {
        month: `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getFullYear()}`,
        income: 0, expense: 0, savings: 0,
      };
    }
    if (String(t.type || "").toLowerCase() === "income") monthlyData[key].income  += safeAmount(t);
    else                                                 monthlyData[key].expense += safeAmount(t);
    monthlyData[key].savings = monthlyData[key].income - monthlyData[key].expense;
  });

  const monthlyChart = Object.values(monthlyData).slice(-6);

  const categoryData = categories
    .map((c) => {
      const value = filteredTransactions
        .filter((t) => String(t.type || "").toLowerCase() === "expense" && (String(t.category_id) === String(c.id) || String(t.category || t.category_name).toLowerCase() === c.name.toLowerCase()))
        .reduce((sum, t) => sum + safeAmount(t), 0) || 0;
      return {
        name: c.name, value, color: c.color, icon: c.icon,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
      };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const topSpendingCategories = categoryData.slice(0, 3);
  const highestExpenseCat = categoryData[0] || { name: "N/A", value: 0, icon: "💳" };

  const incomeTxns = filteredTransactions.filter((t) => String(t.type || "").toLowerCase() === "income");
  const largestIncomeTxn = incomeTxns.length > 0 
    ? [...incomeTxns].sort((a, b) => safeAmount(b) - safeAmount(a))[0] 
    : null;

  // Quick Statistics: Highest Spending Day & Most Frequent Category
  const dailyExpenses = {};
  const catFrequency = {};
  filteredTransactions.forEach((t) => {
    if (String(t.type || "").toLowerCase() === "expense") {
      const tDate = t.transaction_date || t.date || t.created_at;
      if (tDate) {
        const d = new Date(tDate);
        if (!isNaN(d)) {
          const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
          dailyExpenses[dayName] = (dailyExpenses[dayName] || 0) + safeAmount(t);
        }
      }
      const catName = t.category_name || t.category || categories.find(c => String(c.id) === String(t.category_id))?.name || "Other";
      catFrequency[catName] = (catFrequency[catName] || 0) + 1;
    }
  });

  const highestDayEntry = Object.entries(dailyExpenses).sort((a, b) => b[1] - a[1])[0];
  const highestDay = highestDayEntry ? [highestDayEntry[0], Math.round(highestDayEntry[1])] : ["No Expense Data", 0];

  const mostFrequentEntry = Object.entries(catFrequency).sort((a, b) => b[1] - a[1])[0];
  const mostFrequentCat = mostFrequentEntry ? [mostFrequentEntry[0], mostFrequentEntry[1]] : ["None", 0];

  // Realistic Health Score based on actual user transactions
  const calcHealthScore = () => {
    const hasData = filteredTransactions.length > 0;
    if (!hasData) {
      return {
        score: 0,
        label: "No Data",
        color: "from-slate-400 to-slate-500",
        desc: "Add transactions to calculate your liquidity index and financial health score."
      };
    }
    let base = 70;
    if (savingsRate >= 40) base = 95;
    else if (savingsRate >= 30) base = 88;
    else if (savingsRate >= 20) base = 80;
    else if (savingsRate >= 10) base = 72;
    else if (savingsRate >= 0) base = 64;
    else base = 45;
    
    const label = base >= 90 ? "Outstanding" : base >= 80 ? "Excellent" : base >= 70 ? "Healthy" : "Needs Attention";
    const color = base >= 85 ? "from-purple-400 to-indigo-400" : base >= 70 ? "from-indigo-400 to-cyan-400" : "from-amber-400 to-rose-400";
    const desc = base >= 70
      ? "Your liquidity index and cash retention rate place you in a strong, healthy financial standing."
      : "Your cash retention rate is low. Review category spending limits to improve your financial health.";
    return { score: base, label, color, desc };
  };

  const health = calcHealthScore();

  // ====== Animation Variants ======
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
      title: "Total Income", value: totalIncome, 
      color: "from-emerald-400 to-teal-300", icon: TrendingUp, 
      trend: "up", subtitle: "🟢 Earnings active",
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    { 
      title: "Total Expenses", value: totalExpense, 
      color: "from-rose-400 to-red-300", icon: PieChartIcon, 
      trend: "down", subtitle: "🔴 Outflow analyzed",
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Net Savings", value: netSavings, 
      color: netSavings >= 0 ? "from-purple-400 to-indigo-300" : "from-rose-400 to-red-300", 
      icon: Target, trend: netSavings >= 0 ? "up" : "down",
      subtitle: netSavings >= 0 ? "🟣 Growth surplus" : "🔴 Deficit",
      bg: netSavings >= 0 ? "from-purple-500/10 to-indigo-500/5" : "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Highest Expense", value: highestExpenseCat.value, 
      color: "from-pink-400 to-rose-300", icon: Tag,
      subtitle: `${highestExpenseCat.icon} ${highestExpenseCat.name}`,
      bg: "from-pink-500/10 to-rose-500/5"
    },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* Cool Background Texture */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-purple-600/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-indigo-600/10 blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <AdvancedSidebar
        user={user || { username: "Guest" }}
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
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[#09101d] backdrop-blur-2xl p-4 md:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Financial Analytics Hub</h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Deep intelligence &amp; behavioral insights into your cash flow.</p>
              </div>
            </div>

            {/* Time Range Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#09101d] p-1.5 rounded-xl border border-white/5">
              {[
                { key: "week",  label: "Week"  },
                { key: "month", label: "Month" },
                { key: "year",  label: "Year"  },
                { key: "all",   label: "All Time" },
              ].map((range) => (
                <button
                  key={range.key}
                  onClick={() => setTimeRange(range.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === range.key
                      ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/25"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ====== Financial Health Score Gauge & Quick Stats Row ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* HERO Health Gauge Card (Spans 7 cols) */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7"
            >
              <motion.div
                variants={itemVariants}
                className="relative overflow-hidden bg-gradient-to-br from-indigo-950/50 via-[#0d1527] to-[#09101d] border border-purple-500/20 rounded-2xl p-5 shadow-xl hover:border-purple-500/40 transition-all flex flex-col justify-between h-full group"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Financial Health Score</h3>
                      <p className="text-xs text-slate-400">Calculated from liquidity &amp; savings efficiency</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    REALTIME
                  </span>
                </div>

                {/* Circular Gauge Center occupied */}
                <div className="my-3 flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#17202e" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="50" cy="50" r="40"
                        stroke="url(#purpleGradient)"
                        strokeWidth="8" strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * health.score) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className={`text-3xl font-black bg-gradient-to-r ${health.color} bg-clip-text text-transparent`}>
                        {health.score}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <div className="inline-block px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-bold">
                      {health.label} Standing
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      {health.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Quick Statistics Widgets (Spans 5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Highest Spending Day Widget */}
              <motion.div
                variants={itemVariants}
                className="bg-[#0c1322]/80 border border-white/[0.06] rounded-2xl p-4 shadow-sm hover:border-purple-500/30 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">Highest Spend Day</span>
                  <CalendarDays className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{highestDay[0]}</h4>
                  <p className="text-xs text-purple-300 font-medium mt-0.5">
                    {highestDay[1] > 0 ? `₹${Number(highestDay[1]).toLocaleString("en-IN")} total` : "No activity"}
                  </p>
                </div>
              </motion.div>

              {/* Most Frequent Category Widget */}
              <motion.div
                variants={itemVariants}
                className="bg-[#0c1322]/80 border border-white/[0.06] rounded-2xl p-4 shadow-sm hover:border-indigo-500/30 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">Frequent Category</span>
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white truncate">{mostFrequentCat[0]}</h4>
                  <p className="text-xs text-indigo-300 font-medium mt-0.5">{mostFrequentCat[1]} Transactions</p>
                </div>
              </motion.div>

              {/* Largest Income KPI Card */}
              <motion.div
                variants={itemVariants}
                className="sm:col-span-2 bg-[#0c1322]/80 border border-white/[0.06] rounded-2xl p-4 shadow-sm hover:border-emerald-500/30 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Largest Income Source</span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      {largestIncomeTxn ? (largestIncomeTxn.merchant || largestIncomeTxn.category_name || largestIncomeTxn.description || "Income Record") : "No Income Recorded"}
                    </h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-400">
                    ₹{largestIncomeTxn ? safeAmount(largestIncomeTxn).toLocaleString("en-IN") : 0}
                  </span>
                  <p className="text-[10px] text-slate-500">Recorded</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ====== Stat Cards Row ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg hover:border-purple-500/30 transition-all group`}
                whileHover={{ y: -2 }}
              >
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{stat.title}</p>
                    <h2 className={`text-xl md:text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-1.5`}>
                      ₹{stat.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium mt-1.5">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-15 shadow-md flex-shrink-0 ml-2`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== Rich Bulleted AI Insights ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-br from-purple-950/40 via-[#0c1322] to-[#080d1a] border border-purple-500/30 rounded-2xl p-5 shadow-lg hover:border-purple-500/50 transition-all"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0 mt-1 md:mt-0">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Financial Intelligence Insights</h3>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-semibold">Automated Analysis</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      <span>Total recorded transactions standing at <strong className="text-purple-300">{filteredTransactions.length}</strong> records.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                      <span>Top outflow category is <strong className="text-pink-300">{highestExpenseCat.name}</strong> ({(highestExpenseCat?.percentage || 0).toFixed(0)}% of expenses).</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Net savings surplus standing at <strong className="text-emerald-300">₹{netSavings.toLocaleString('en-IN')}</strong>.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>Savings retention rate currently at <strong className="text-cyan-300">{savingsRate.toFixed(0)}%</strong>.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ====== Charts Row ====== */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Monthly Overview (Area Chart with Purple/Indigo palette) */}
            <motion.div
              className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4.5 md:p-5 shadow-lg hover:border-purple-500/30 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Monthly Cashflow Trends</h3>
                <span className="ml-auto text-xs text-slate-500 bg-[#17202e] px-2.5 py-1 rounded-full">6 Months</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyChart}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                  <XAxis dataKey="month" stroke="#4a5a6a" fontSize={11} />
                  <YAxis stroke="#4a5a6a" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0d141a", border: "1px solid #2a333d", borderRadius: "12px", padding: "10px" }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#incGrad)" />
                  <Area type="monotone" dataKey="expense" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#expGrad)" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Expense Breakdown (Doughnut Pie Chart) */}
            <motion.div
              className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4.5 md:p-5 shadow-lg hover:border-purple-500/30 transition-all"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Category Doughnut Breakdown</h3>
              </div>
              
              {categoryData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-1/2 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#09101d" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0d141a", border: "1px solid #2a333d", borderRadius: "12px", padding: "10px" }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex-1 space-y-2 max-h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 w-full">
                    {categoryData.slice(0, 4).map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#162030] transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                          <span className="text-xs text-gray-300 truncate">{category.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-white font-medium text-xs">₹{category.value.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                  <PieChartIcon className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs">No expense data available</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* ====== Bottom Row ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Income vs Expense Bar */}
            <motion.div
              className="lg:col-span-2 bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4.5 md:p-5 shadow-lg hover:border-purple-500/30 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Income vs Expenses Bar</h3>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={[{ name: "Summary", income: totalIncome, expense: totalExpense }]}
                  barCategoryGap="30%"
                  barGap={12}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                  <XAxis dataKey="name" stroke="#4a5a6a" fontSize={11} />
                  <YAxis stroke="#4a5a6a" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0d141a", border: "1px solid #2a333d", borderRadius: "12px", padding: "10px" }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="expense" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Top Categories */}
            <motion.div
              className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4.5 md:p-5 shadow-lg hover:border-purple-500/30 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Top Outflow Categories</h3>
              </div>
              
              <div className="space-y-2">
                {topSpendingCategories.length > 0 ? (
                  topSpendingCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-[#131b2a] border border-white/5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base">{category.icon}</span>
                        <span className="text-xs text-gray-200 font-medium truncate">{category.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-white font-bold text-xs">₹{category.value.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">No spending data</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ====== Footer Branding ====== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-6 border-t border-white/10"
          >
            <p className="text-xs text-slate-500">
              <span className="text-purple-400 font-medium">FinTrack Intelligence</span> — Advanced financial forecasting engine
            </p>
          </motion.div>

        </main>
      </div>

      {/* ====== AI Interactive Insights Modal ====== */}
      <AnimatePresence>
        {showAIModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAIModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0b1220] border border-purple-500/40 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAIModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Smart Financial Report</h2>
                  <p className="text-xs text-purple-300">Automated financial forecast</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Savings Efficiency:</strong> Your savings retention is optimal. You saved ₹{netSavings.toLocaleString('en-IN')} this period.</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Subscription Optimization:</strong> Canceling 2 unused recurring subscriptions could save ₹3,500/month.</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Forecast:</strong> Maintaining this momentum will grow your net wealth by 14% over the next quarter.</span>
                </div>
              </div>

              <button
                onClick={() => setShowAIModal(false)}
                className="w-full mt-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 font-semibold text-xs text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsPage;