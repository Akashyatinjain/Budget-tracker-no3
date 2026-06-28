// AnalyticsPage.jsx - FinTrack Teal/Navy Theme
import React, { useState, useEffect } from "react";
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
  FiTrendingUp, FiPieChart, FiCalendar, FiBarChart2,
  FiActivity, FiTarget, FiAward, FiArrowUp, FiArrowDown,
  FiRefreshCw, FiZap, FiShield, FiClock
} from "react-icons/fi";

const AnalyticsPage = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");

  const categories = [
    { id: 1, name: "Food & Dining",    color: "#10b981", icon: "🍕" },
    { id: 2, name: "Shopping",         color: "#8b5cf6", icon: "🛍️" },
    { id: 3, name: "Transportation",   color: "#06b6d4", icon: "🚗" },
    { id: 4, name: "Entertainment",    color: "#eab308", icon: "🎬" },
    { id: 5, name: "Bills & Utilities",color: "#14b8a6", icon: "💡" },
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

  // Shared chart style tokens
  const tooltipStyle = {
    background: "#0d1117",
    border: "1px solid #065f46",
    borderRadius: "8px",
    color: "#fff",
  };
  const gridStroke  = "#1e2a1e";
  const axisStroke  = "#10b981";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0d1117] text-emerald-300">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-3"
        >
          <FiRefreshCw className="w-6 h-6" />
          <span>Loading analytics...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-gray-100">
      <AdvancedSidebar
        user={user || { username: "Guest" }}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-6 mt-16 flex flex-col gap-8">

          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-emerald-400">Analytics</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  <FiZap className="w-3 h-3" />
                  AI Insights Active
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Deep insights into your spending &amp; saving patterns 📊
              </p>
            </div>

            {/* Time range pills */}
            <motion.div className="flex gap-2 mt-4 md:mt-0">
              {[
                { key: "week",  label: "This Week"  },
                { key: "month", label: "This Month" },
                { key: "year",  label: "This Year"  },
                { key: "all",   label: "All Time"   },
              ].map((range) => (
                <motion.button
                  key={range.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTimeRange(range.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    timeRange === range.key
                      ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 border-transparent"
                      : "bg-[#161b22]/80 text-gray-400 hover:text-white hover:bg-[#1f2937] border-[#30363d]/60"
                  }`}
                >
                  {range.label}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Financial Health Score ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#161b22]/80 border border-[#30363d]/60 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <FiAward className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Financial Health</h3>
                  <p className="text-gray-400 text-sm">Based on your spending patterns</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className={`text-4xl font-bold ${
                    financialHealthScore >= 70 ? "text-emerald-400" :
                    financialHealthScore >= 50 ? "text-yellow-400" : "text-red-400"
                  }`}
                >
                  {financialHealthScore}/100
                </motion.div>
                <div className="w-32 h-2 bg-[#21262d] rounded-full mt-2 mx-auto">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${financialHealthScore}%` }}
                    transition={{ delay: 0.7, duration: 1 }}
                    className={`h-full rounded-full ${
                      financialHealthScore >= 70
                        ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                        : financialHealthScore >= 50
                        ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                        : "bg-gradient-to-r from-red-400 to-rose-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Total Income",   value: totalIncome,  color: "text-emerald-400", icon: FiTrendingUp, trend: "positive", subtitle: "This period" },
              { title: "Total Expenses", value: totalExpense, color: "text-rose-400",    icon: FiPieChart,   trend: "negative", subtitle: "This period" },
              {
                title: "Net Savings",
                value: netSavings,
                color: netSavings >= 0 ? "text-emerald-400" : "text-rose-400",
                icon: FiTarget,
                trend: netSavings >= 0 ? "positive" : "negative",
                subtitle: netSavings >= 0 ? "Saving progress" : "Deficit",
              },
              {
                title: "Savings Rate",
                value: savingsRate,
                color: savingsRate >= 20 ? "text-emerald-400" : savingsRate >= 10 ? "text-yellow-400" : "text-rose-400",
                icon: FiZap,
                isPercentage: true,
                trend: savingsRate >= 20 ? "positive" : savingsRate >= 10 ? "neutral" : "negative",
                subtitle: savingsRate >= 20 ? "Excellent!" : savingsRate >= 10 ? "Good progress" : "Needs improvement",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ y: -2 }}
                className="bg-[#161b22]/80 border border-[#30363d]/60 rounded-xl p-6 shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <h2 className={`text-2xl font-bold ${stat.color} mt-1`}>
                      {stat.isPercentage
                        ? `${stat.value.toFixed(1)}%`
                        : `₹${stat.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                    </h2>
                    {stat.subtitle && (
                      <p className={`text-xs mt-1 ${
                        stat.trend === "positive" ? "text-emerald-400" :
                        stat.trend === "negative" ? "text-rose-400" : "text-yellow-400"
                      }`}>
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    stat.trend === "positive" ? "bg-emerald-500/20" :
                    stat.trend === "negative" ? "bg-rose-500/20"    : "bg-yellow-500/20"
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.trend === "positive" ? "text-emerald-400" :
                      stat.trend === "negative" ? "text-rose-400"    : "text-yellow-400"
                    }`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── AI Insight Banner ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#161b22]/80 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <FiZap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">AI Insight</p>
                <p className="text-xs text-gray-400">
                  {savingsRate >= 20
                    ? "Great job! Your savings rate is above 20%. Keep up the excellent work! 🎯"
                    : savingsRate >= 10
                    ? "Good progress! Try to increase your savings rate to 20% for better financial health."
                    : "Consider reviewing your expenses. Small changes can make a big difference over time."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FiShield className="w-3 h-3 text-emerald-400" />
                Secure
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                Real-time
              </span>
            </div>
          </motion.div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Monthly Overview */}
            <motion.div
              className="bg-[#161b22]/80 border border-[#30363d]/60 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <FiCalendar className="text-emerald-400 w-5 h-5" />
                <h3 className="text-lg font-semibold text-emerald-300">Monthly Overview</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyChart}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" stroke={axisStroke} fontSize={12} />
                  <YAxis stroke={axisStroke} fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: "#9ca3af" }} />
                  <Area type="monotone" dataKey="income"  stroke="#22c55e" fillOpacity={1} fill="url(#incomeGradient)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#expenseGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Expense Breakdown */}
            <motion.div
              className="bg-[#161b22]/80 border border-[#30363d]/60 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <FiPieChart className="text-emerald-400 w-5 h-5" />
                <h3 className="text-lg font-semibold text-emerald-300">Expense Breakdown</h3>
              </div>
              {categoryData.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                        contentStyle={tooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3 mt-4 lg:mt-0 lg:ml-4">
                    {categoryData.slice(0, 4).map((category, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#1a2f1a]/40 border border-[#30363d]/40 hover:border-emerald-600/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{category.icon}</span>
                          <span className="text-sm text-gray-300">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium text-sm">₹{category.value.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-6">No expense data available.</p>
              )}
            </motion.div>
          </div>

          {/* ── Bottom Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income vs Expense Bar */}
            <motion.div
              className="lg:col-span-2 bg-[#161b22]/80 border border-[#30363d]/60 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <FiBarChart2 className="text-emerald-400 w-5 h-5" />
                <h3 className="text-lg font-semibold text-emerald-300">Income vs Expenses</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[{ name: "You", income: totalIncome, expense: totalExpense }]}
                  barCategoryGap="30%"
                  barGap={6}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={12}
                    tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v}
                    domain={[0, "dataMax + 10000"]}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [
                      `₹${value.toLocaleString("en-IN")}`,
                      name.charAt(0).toUpperCase() + name.slice(1),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
                  <Bar dataKey="income"  fill="#22c55e" radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Top Categories + Savings Tip */}
            <motion.div
              className="bg-[#161b22]/80 border border-[#30363d]/60 rounded-xl p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <FiActivity className="text-emerald-400 w-5 h-5" />
                <h3 className="text-lg font-semibold text-emerald-300">Top Categories</h3>
              </div>
              <div className="space-y-3">
                {topSpendingCategories.length > 0 ? (
                  topSpendingCategories.map((category, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#1a2f1a]/40 border border-[#30363d]/40 hover:border-emerald-600/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="text-sm text-gray-300">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium text-sm">₹{category.value.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{category.percentage.toFixed(1)}%</div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-6 text-sm">No spending data available.</p>
                )}
              </div>

              {topSpendingCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-6 p-4 rounded-xl bg-[#1a1a0d]/60 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <FiTarget className="w-4 h-4" />
                    <span className="text-sm font-medium">Savings Tip</span>
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

        </main>
      </div>
    </div>
  );
};

export default AnalyticsPage;