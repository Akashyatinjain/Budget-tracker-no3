// AnalyticsPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect, useRef } from "react";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth, api } from "../context/AuthContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, BarChart, Bar, AreaChart, Area
} from "recharts";
import { motion } from "framer-motion";
import {
  TrendingUp, PieChart as PieChartIcon, Calendar,
  BarChart3, Activity, Target, Award, ArrowUp, ArrowDown,
  RefreshCw, Zap, Shield, Clock, Sparkles,
  Eye, Layers, Brain
} from "lucide-react";

const AnalyticsPage = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");

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
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen]);

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
    .filter((t) => String(t.type).toLowerCase() === "income")
    .reduce((sum, t) => sum + safeAmount(t), 0);

  const totalExpense = filteredTransactions
    .filter((t) => String(t.type).toLowerCase() === "expense")
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
    if (String(t.type).toLowerCase() === "income") monthlyData[key].income  += safeAmount(t);
    else                                            monthlyData[key].expense += safeAmount(t);
    monthlyData[key].savings = monthlyData[key].income - monthlyData[key].expense;
  });

  const monthlyChart = Object.values(monthlyData).slice(-6);

  const categoryData = categories
    .map((c) => {
      const value = filteredTransactions
        .filter((t) => String(t.type).toLowerCase() === "expense" && parseInt(t.category_id) === c.id)
        .reduce((sum, t) => sum + safeAmount(t), 0) || 0;
      return {
        name: c.name, value, color: c.color, icon: c.icon,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
      };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const topSpendingCategories = categoryData.slice(0, 3);

  const expenseCount = filteredTransactions.filter((t) => String(t.type).toLowerCase() === "expense").length || 1;
  const incomeCount  = filteredTransactions.filter((t) => String(t.type).toLowerCase() === "income").length  || 1;
  const avgExpense   = totalExpense / expenseCount;
  const avgIncome    = totalIncome  / incomeCount;

  const financialHealthScore = Math.max(0, Math.min(100, Math.round(savingsRate * 2 + 50)));

  const healthColor = 
    financialHealthScore >= 70 ? "from-emerald-400 to-teal-300" :
    financialHealthScore >= 50 ? "from-yellow-400 to-orange-400" :
    "from-red-400 to-rose-400";

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
      title: "Total Income", value: totalIncome, 
      color: "from-green-400 to-emerald-300", icon: TrendingUp, 
      trend: "up", subtitle: "This period",
      bg: "from-green-500/10 to-emerald-500/5"
    },
    { 
      title: "Total Expenses", value: totalExpense, 
      color: "from-rose-400 to-red-300", icon: PieChartIcon, 
      trend: "down", subtitle: "This period",
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Net Savings", value: netSavings, 
      color: netSavings >= 0 ? "from-emerald-400 to-teal-300" : "from-rose-400 to-red-300", 
      icon: Target, trend: netSavings >= 0 ? "up" : "down",
      subtitle: netSavings >= 0 ? "Saving progress" : "Deficit",
      bg: netSavings >= 0 ? "from-emerald-500/10 to-teal-500/5" : "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Savings Rate", value: savingsRate, 
      color: savingsRate >= 20 ? "from-emerald-400 to-teal-300" : savingsRate >= 10 ? "from-yellow-400 to-orange-300" : "from-rose-400 to-red-300", 
      icon: Zap, isPercentage: true,
      trend: savingsRate >= 20 ? "up" : savingsRate >= 10 ? "neutral" : "down",
      subtitle: savingsRate >= 20 ? "Excellent!" : savingsRate >= 10 ? "Good progress" : "Needs improvement",
      bg: savingsRate >= 20 ? "from-emerald-500/10 to-teal-500/5" : savingsRate >= 10 ? "from-yellow-500/10 to-orange-500/5" : "from-rose-500/10 to-red-500/5"
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
        user={user || { username: "Guest" }}
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
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Financial Analytics Hub</h1>
                <p className="text-xs text-slate-400">Deep insights into your spending &amp; saving patterns</p>
              </div>
            </div>

            {/* Time Range Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "week",  label: "This Week"  },
                { key: "month", label: "This Month" },
                { key: "year",  label: "This Year"  },
                { key: "all",   label: "All Time"   },
              ].map((range) => (
                <button
                  key={range.key}
                  onClick={() => setTimeRange(range.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    timeRange === range.key
                      ? "bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 text-white shadow-md shadow-emerald-500/30"
                      : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/30"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ====== Financial Health Score Card ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 group"
              whileHover={{ y: -2, scale: 1.005 }}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 shadow-lg">
                    <Award className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Financial Health Score</h3>
                    <p className="text-sm text-slate-400 mt-1">Based on your spending &amp; saving patterns</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className={`text-5xl font-black bg-gradient-to-r ${healthColor} bg-clip-text text-transparent`}
                  >
                    {financialHealthScore}
                    <span className="text-2xl">/100</span>
                  </motion.div>
                  
                  <div className="w-40 h-3 bg-[#1a2228] rounded-full mt-3 mx-auto overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${financialHealthScore}%` }}
                      transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${healthColor}`}
                    />
                  </div>
                  
                  <p className={`text-xs mt-2 font-medium ${
                    financialHealthScore >= 70 ? "text-emerald-400" :
                    financialHealthScore >= 50 ? "text-yellow-400" : "text-rose-400"
                  }`}>
                    {financialHealthScore >= 70 ? "Excellent Health" :
                     financialHealthScore >= 50 ? "Good Standing" : "Needs Attention"}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ====== Stat Cards Row ====== */}
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
                      {stat.isPercentage
                        ? `${stat.value.toFixed(1)}%`
                        : `₹${stat.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                    </h2>
                    {stat.subtitle && (
                      <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 shadow-lg`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.trend === "up" ? "text-emerald-400" :
                      stat.trend === "down" ? "text-rose-400" : "text-yellow-400"
                    }`} />
                  </div>
                </div>
                
                {/* Trend indicator */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1">
                  <span className={`text-xs font-medium ${
                    stat.trend === "up" ? "text-emerald-400" :
                    stat.trend === "down" ? "text-rose-400" : "text-yellow-400"
                  }`}>
                    {stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : "→"}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== AI Insight Banner ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 shadow-lg hover:border-emerald-500/40 transition-all"
            whileHover={{ y: -1 }}
          >
            <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-emerald-500/20 blur-[40px]" />
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <Brain className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AI Insight</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {savingsRate >= 20
                      ? "Great job! Your savings rate is above 20%. Keep up the excellent work! 🎯"
                      : savingsRate >= 10
                      ? "Good progress! Try to increase your savings rate to 20% for better financial health."
                      : "Consider reviewing your expenses. Small changes can make a big difference over time."}
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

          {/* ====== Charts Row ====== */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Monthly Overview */}
            <motion.div
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Monthly Overview</h3>
                <span className="ml-auto text-xs text-slate-500 bg-[#1a2228] px-3 py-1 rounded-full">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyChart}>
                  <defs>
                    <linearGradient id="incomeGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                  <XAxis dataKey="month" stroke="#4a5a6a" fontSize={11} />
                  <YAxis stroke="#4a5a6a" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d141a",
                      border: "1px solid #2a333d",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#incomeGradient2)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#expenseGradient2)" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Expense Breakdown */}
            <motion.div
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
                  <PieChartIcon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Expense Breakdown</h3>
              </div>
              
              {categoryData.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <div className="w-full lg:w-1/2 h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={2}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0a0e12" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0d141a",
                            border: "1px solid #2a333d",
                            borderRadius: "12px",
                            padding: "12px",
                          }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex-1 space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20 w-full">
                    {categoryData.slice(0, 4).map((category, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1a2228] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                          <span className="text-sm text-gray-300 truncate">{category.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="text-white font-medium text-sm">₹{category.value.toLocaleString('en-IN')}</div>
                          <div className="text-xs text-slate-500">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <PieChartIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No expense data available</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* ====== Bottom Row ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income vs Expense Bar */}
            <motion.div
              className="lg:col-span-2 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Income vs Expenses</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[{ name: "Overview", income: totalIncome, expense: totalExpense }]}
                  barCategoryGap="30%"
                  barGap={8}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                  <XAxis dataKey="name" stroke="#4a5a6a" fontSize={12} />
                  <YAxis
                    stroke="#4a5a6a"
                    fontSize={12}
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                    domain={[0, "dataMax + 10000"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d141a",
                      border: "1px solid #2a333d",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="income" fill="#22c55e" radius={[8, 8, 0, 0]} barSize={50} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Top Categories + Savings Tip */}
            <motion.div
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Top Categories</h3>
              </div>
              
              <div className="space-y-2">
                {topSpendingCategories.length > 0 ? (
                  topSpendingCategories.map((category, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1a2228] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                        <span className="text-sm text-gray-300 truncate">{category.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-white font-medium text-sm">₹{category.value.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-slate-500">{category.percentage.toFixed(1)}%</div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                    <Eye className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs">No spending data available</p>
                  </div>
                )}
              </div>

              {topSpendingCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-6 p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm font-semibold">Savings Tip</span>
                  </div>
                  <p className="text-xs text-yellow-300/80 leading-relaxed">
                    {savingsRate < 0
                      ? `You're spending more than you earn. Consider reviewing your ${topSpendingCategories[0]?.name || "top"} expenses.`
                      : savingsRate < 20
                      ? `Aim for 20% savings rate. Try reducing ${topSpendingCategories[0]?.name || "spending"} by 10% this month.`
                      : "Excellent! You're saving over 20%. Consider investing the surplus for long-term growth."}
                  </p>
                </motion.div>
              )}
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
              <span className="text-emerald-400 font-medium">FinTrack</span> — Trusted by finance professionals across India
            </p>
          </motion.div>

        </main>
      </div>
    </div>
  );
};

export default AnalyticsPage;