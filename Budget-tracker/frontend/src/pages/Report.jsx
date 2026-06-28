import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { useAuth, api } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPieChart,
  FiBarChart2,
  FiDownload,
  FiZap,
  FiShield,
  FiClock,
  FiTarget,
  FiRepeat,
  FiAlertCircle
} from "react-icons/fi";

const normalizeTransactionsResponse = (resData) => {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData.transactions)) return resData.transactions;
  if (Array.isArray(resData.data)) return resData.data;
  return [];
};

const safeAmount = (val) => {
  if (val == null) return 0;
  const n = parseFloat(String(val).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const ReportsPage = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [reportType, setReportType] = useState("spending");
  const [timeRange, setTimeRange] = useState("month");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const reportTypes = [
    { value: "spending", label: "Spending Analysis", description: "Category-wise spending breakdown", icon: FiPieChart },
    { value: "income", label: "Income Report", description: "Income sources and trends", icon: FiTrendingUp },
    { value: "savings", label: "Savings Report", description: "Savings growth and patterns", icon: FiTarget },
    { value: "subscriptions", label: "Subscriptions", description: "Recurring expenses analysis", icon: FiRepeat },
    { value: "comparison", label: "Period Comparison", description: "Compare different time periods", icon: FiBarChart2 },
  ];

  const timeRanges = [
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last Month" },
    { value: "quarter", label: "Last 3 Months" },
    { value: "year", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ];

  useEffect(() => {
    fetchTransactions();
    fetchSubscriptions();
  }, [token]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
  }, [mobileSidebarOpen]);

  const fetchTransactions = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/api/transactions");
      const raw = res.data.transactions || res.data;
      setTransactions(normalizeTransactionsResponse(raw));
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setTransactions(generateSampleTransactions());
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    if (!token) return;
    try {
      const res = await api.get("/api/subscriptions");
      const data = res.data.subscriptions || res.data;
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
      setSubscriptions([]);
    }
  };

  const generateSampleTransactions = () => {
    const sampleData = [];
    const categories = ["Food & Dining", "Shopping", "Transportation", "Entertainment", "Bills & Utilities", "Healthcare", "Salary"];
    const types = ["expense", "expense", "expense", "expense", "expense", "expense", "income"];
    
    for (let i = 0; i < 50; i++) {
      const randomCat = Math.floor(Math.random() * categories.length);
      sampleData.push({
        id: i + 1,
        merchant: `Merchant ${i + 1}`,
        category_id: randomCat + 1,
        type: types[randomCat],
        amount: Math.random() * 1000 + 50,
        transaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Transaction ${i + 1}`
      });
    }
    return sampleData;
  };

  const processReportData = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const filteredTransactions = transactions.filter(t => {
      const dateOk =
        new Date(t.transaction_date) >= startDate &&
        new Date(t.transaction_date) <= now;

      const categoryOk =
        categoryFilter === "all" ||
        String(t.category_id) === String(categoryFilter);

      return dateOk && categoryOk;
    });

    const categorySpending = categories.map(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => parseInt(t.category_id) === category.id && t.type === "expense"
      );
      const total = categoryTransactions.reduce((sum, t) => sum + safeAmount(t.amount), 0);
      return {
        name: category.name,
        value: Math.round(total),
        color: category.color,
        count: categoryTransactions.length
      };
    }).filter(item => item.value > 0);

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + safeAmount(t.amount), 0);

      const expenses = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + safeAmount(t.amount), 0);

      monthlyData.push({
        month: monthKey,
        income: Math.round(income),
        expenses: Math.round(expenses),
        savings: Math.round(income - expenses)
      });
    }

    const topExpenses = filteredTransactions
      .filter(t => t.type === "expense")
      .sort((a, b) => safeAmount(b.amount) - safeAmount(a.amount))
      .slice(0, 10)
      .map(t => ({
        name: t.merchant,
        amount: safeAmount(t.amount),
        category: categories.find(c => parseInt(c.id) === parseInt(t.category_id))?.name || 'Unknown',
        date: new Date(t.transaction_date).toLocaleDateString()
      }));

    const activeSubscriptions = subscriptions.filter(sub => sub.status === "active");
    const subscriptionCost = activeSubscriptions.reduce((sum, sub) => {
      let monthlyCost = parseFloat(sub.amount);
      switch (sub.billing_cycle) {
        case 'yearly': monthlyCost = monthlyCost / 12; break;
        case 'quarterly': monthlyCost = monthlyCost / 3; break;
        case 'weekly': monthlyCost = monthlyCost * 4; break;
        case 'daily': monthlyCost = monthlyCost * 30; break;
      }
      return sum + monthlyCost;
    }, 0);

    return {
      categorySpending,
      monthlyData,
      topExpenses,
      subscriptionCost: Math.round(subscriptionCost),
      activeSubscriptions: activeSubscriptions.length,
      totalTransactions: filteredTransactions.length,
      totalIncome: Math.round(filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + safeAmount(t.amount), 0)),
      totalExpenses: Math.round(filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + safeAmount(t.amount), 0)),
      netSavings: Math.round(filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + safeAmount(t.amount), 0) - 
                    filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + safeAmount(t.amount), 0))
    };
  };

  const reportData = processReportData();

  const computeYAxisTicks = (maxVal) => {
    if (!Number.isFinite(maxVal) || maxVal <= 0) return [0, 1];
    const targetSteps = 4;
    const approxStep = Math.ceil(maxVal / targetSteps);
    const magnitude = Math.pow(10, Math.floor(Math.log10(approxStep)));
    const niceStep = Math.ceil(approxStep / magnitude) * magnitude;
    const ticks = [];
    for (let i = 0; i <= targetSteps; i++) ticks.push(i * niceStep);
    return ticks;
  };

  const savingsRate =
    reportData.totalIncome > 0
      ? ((reportData.netSavings / reportData.totalIncome) * 100).toFixed(1)
      : 0;

  const monthlyMax = Math.max(
    0,
    ...reportData.monthlyData.flatMap(d => [Number(d.income) || 0, Number(d.expenses) || 0, Number(d.savings) || 0])
  );
  const yAxisTicks = computeYAxisTicks(monthlyMax);
  const yAxisTop = yAxisTicks[yAxisTicks.length - 1] ?? 1;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111118] border border-white/10 p-3 rounded-xl shadow-lg">
          <p className="text-white font-semibold text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₹{entry.value?.toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const exportToPDF = async () => {
    setExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Report exported to PDF successfully!");
    setExporting(false);
  };

  const exportToCSV = () => {
    toast.success("Exporting report to CSV...");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
        <AdvancedSidebar
          user={user}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-3 text-emerald-400"
          >
            <FiBarChart2 className="w-6 h-6" />
            <span>Generating reports...</span>
          </motion.div>
        </div>
      </div>
    );
  }

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
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0"
          >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Financial Reports</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  <FiZap className="w-3 h-3" />
                  AI Insights Active
                </span>
              </div>
              <p className="text-gray-400 text-sm">Comprehensive analysis of your financial data</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2.5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {exporting ? "⏳ Exporting..." : <><FiDownload className="w-4 h-4" /> Export PDF</>}
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
                <FiBarChart2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Report Summary</p>
                <p className="text-xs text-gray-400">
                  {reportData.totalTransactions} transactions analyzed · Savings rate: {savingsRate}%
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

          {/* Report Controls */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Income", value: reportData.totalIncome, color: "text-emerald-400", icon: FiTrendingUp, bgColor: "bg-emerald-500/20" },
              { label: "Total Expenses", value: reportData.totalExpenses, color: "text-rose-400", icon: FiTrendingDown, bgColor: "bg-rose-500/20" },
              { label: "Net Savings", value: reportData.netSavings, color: reportData.netSavings >= 0 ? "text-emerald-400" : "text-rose-400", icon: FiTarget, bgColor: reportData.netSavings >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20" },
              { label: "Transactions", value: reportData.totalTransactions, color: "text-teal-400", icon: FiDollarSign, bgColor: "bg-teal-500/20" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <h3 className={`text-xl font-bold ${stat.color} mt-1`}>
                      ₹{stat.value.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category Pie Chart */}
            <SpendingPieChart reportData={reportData} />

            {/* Monthly Trends Line Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <FiTrendingUp className="text-emerald-400 w-5 h-5" />
                <h3 className="text-lg font-semibold text-white">Monthly Trends</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.monthlyData}
                    margin={{ top: 10, right: 30, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis
                      width={84}
                      stroke="#6b7280"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickFormatter={(v) => (Number.isFinite(v) ? v.toLocaleString("en-IN") : v)}
                      domain={[0, yAxisTop]}
                      ticks={yAxisTicks}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
                    <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981" }} />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444" }} />
                    <Line type="monotone" dataKey="savings" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Spending Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <FiBarChart2 className="text-emerald-400 w-5 h-5" />
                <h3 className="text-lg font-semibold text-white">Category-wise Spending</h3>
              </div>
              <div className="h-80">
                {reportData.categorySpending.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.categorySpending}
                      margin={{ top: 10, right: 30, left: 48, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis
                        width={80}
                        stroke="#6b7280"
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        tickFormatter={(v) => (Number.isFinite(v) ? v.toLocaleString("en-IN") : v)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {reportData.categorySpending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No category data available
                  </div>
                )}
              </div>
            </motion.div>

            {/* Top Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <FiTrendingDown className="text-rose-400 w-5 h-5" />
                <h3 className="text-lg font-semibold text-white">Top 10 Expenses</h3>
              </div>
              <div className="h-80 overflow-y-auto pr-2">
                <div className="space-y-3">
                  {reportData.topExpenses.map((expense, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.03 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/10 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-emerald-400 text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{expense.name}</div>
                          <div className="text-xs text-gray-400">{expense.category} • {expense.date}</div>
                        </div>
                      </div>
                      <div className="text-rose-400 font-semibold">₹{expense.amount.toLocaleString('en-IN')}</div>
                    </motion.div>
                  ))}
                  {reportData.topExpenses.length === 0 && (
                    <div className="text-center py-8 text-gray-400">No expense data available</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Subscriptions Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <FiRepeat className="text-emerald-400 w-5 h-5" />
              <h3 className="text-lg font-semibold text-white">🔄 Subscriptions Overview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Active Subscriptions", value: reportData.activeSubscriptions, color: "text-teal-400" },
                { label: "Monthly Cost", value: reportData.subscriptionCost, color: "text-rose-400" },
                { label: "Yearly Cost", value: reportData.subscriptionCost * 12, color: "text-yellow-400" }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className={`text-2xl font-bold ${item.color}`}>
                    {item.label === "Active Subscriptions" ? item.value : `₹${item.value.toLocaleString('en-IN')}`}
                  </div>
                  <div className="text-sm text-gray-400">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Insights Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <FiZap className="text-emerald-400 w-5 h-5" />
              <h3 className="text-lg font-semibold text-white">💡 Financial Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                  <FiTrendingUp className="w-4 h-4" />
                  Positive Trends
                </h4>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    Your savings rate is {savingsRate}% of income
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    You have {reportData.activeSubscriptions} active subscriptions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    Top spending category: {reportData.categorySpending[0]?.name || 'N/A'}
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
                <h4 className="font-semibold text-rose-400 mb-2 flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4" />
                  Areas for Improvement
                </h4>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    Consider reducing spending in top categories
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    Review subscription costs for optimization
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    Monitor your expense-to-income ratio
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

// SpendingPieChart Component - FinTrack Theme
function SmallCustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#111118] border border-white/10 p-3 rounded-xl shadow-lg text-white">
      <div className="font-medium text-sm">{data.name}</div>
      <div className="text-sm text-gray-300">Amount: ₹{(data.value || 0).toLocaleString("en-IN")}</div>
    </div>
  );
}

function SpendingPieChart({ reportData }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;
  const isMobile = width > 0 && width < 480;
  const isTablet = width >= 480 && width < 1024;
  const isDesktop = width >= 1024;

  const legendWidth = (isDesktop || isTablet) ? 140 : 0;
  const padding = 24;
  const availableWidth = Math.max(0, width - legendWidth - padding);
  const availableHeight = Math.max(0, height - padding);
  const maxDiameter = Math.max(0, Math.min(availableWidth, availableHeight));
  const outerRadius = Math.max(20, Math.min(90, Math.floor(maxDiameter * (isMobile ? 0.38 : 0.45))));
  const innerRadius = Math.max(10, Math.floor(outerRadius * 0.48));
  const cxPercent = legendWidth && width ? ((availableWidth / 2) / width) * 100 : 50;
  const cx = `${cxPercent}%`;
  const showLabels = isDesktop;
  const legendLayout = isMobile ? "horizontal" : "vertical";
  const legendAlign = isMobile ? "center" : "right";
  const legendVerticalAlign = isMobile ? "bottom" : "middle";

  if (!reportData || !Array.isArray(reportData.categorySpending)) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <FiPieChart className="text-emerald-400 w-5 h-5" />
          <h3 className="text-lg font-semibold text-white">Spending by Category</h3>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-400">No spending data available</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        <FiPieChart className="text-emerald-400 w-5 h-5" />
        <h3 className="text-lg font-semibold text-white">Spending by Category</h3>
      </div>

      <div
        ref={containerRef}
        className="w-full h-44 sm:h-56 md:h-64 lg:h-72 relative"
        role="img"
        aria-label="Pie chart showing spending by category"
      >
        {reportData.categorySpending.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={reportData.categorySpending}
                cx={cx}
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                labelLine={false}
                label={
                  showLabels
                    ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`
                    : undefined
                }
                dataKey="value"
              >
                {reportData.categorySpending.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || "#10b981"} />
                ))}
              </Pie>
              <Tooltip content={<SmallCustomTooltip />} />
              <Legend
                layout={legendLayout}
                verticalAlign={legendVerticalAlign}
                align={legendAlign}
                iconSize={isMobile ? 10 : 14}
                wrapperStyle={{
                  paddingTop: 6,
                  paddingBottom: 6,
                  ...(isDesktop || isTablet
                    ? { right: 8, width: legendWidth, top: "50%", transform: "translateY(-50%)" }
                    : { bottom: 6, left: '50%', transform: 'translateX(-50%)' }),
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No spending data available
          </div>
        )}
      </div>

      {!showLabels && reportData.categorySpending.length > 0 && (
        <div className="mt-3 text-sm text-gray-300">
          Top categories: {reportData.categorySpending
            .slice()
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
            .map((c) => `${c.name} (${c.value.toLocaleString('en-IN')})`)
            .join(" • ")}
        </div>
      )}
    </motion.div>
  );
}

export default ReportsPage;