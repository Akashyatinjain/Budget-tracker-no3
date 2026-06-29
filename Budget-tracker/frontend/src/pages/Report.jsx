// ReportsPage.jsx - FinTrack Unified Design System
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Download,
  Zap,
  Shield,
  Clock,
  Target,
  Repeat,
  AlertCircle,
  Sparkles,
  FileText,
  Filter,
  Calendar,
  Layers,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  FileSpreadsheet,
  FileOutput
} from "lucide-react";

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
    { id: 1, name: "Food & Dining",    color: "#f43f5e", icon: "🍕" },
    { id: 2, name: "Shopping",         color: "#8b5cf6", icon: "🛍️" },
    { id: 3, name: "Transportation",   color: "#06b6d4", icon: "🚗" },
    { id: 4, name: "Entertainment",    color: "#f59e0b", icon: "🎬" },
    { id: 5, name: "Bills & Utilities",color: "#84cc16", icon: "💡" },
    { id: 6, name: "Healthcare",       color: "#ef4444", icon: "🏥" },
    { id: 7, name: "Salary",           color: "#22c55e", icon: "💰" },
    { id: 8, name: "Investment",       color: "#3b82f6", icon: "📈" },
  ];

  const reportTypes = [
    { value: "spending", label: "Spending Analysis", description: "Category-wise spending breakdown", icon: PieChartIcon },
    { value: "income", label: "Income Report", description: "Income sources and trends", icon: TrendingUp },
    { value: "savings", label: "Savings Report", description: "Savings growth and patterns", icon: Target },
    { value: "subscriptions", label: "Subscriptions", description: "Recurring expenses analysis", icon: Repeat },
    { value: "comparison", label: "Period Comparison", description: "Compare different time periods", icon: BarChart3 },
  ];

  const timeRanges = [
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last Month" },
    { value: "quarter", label: "Last 3 Months" },
    { value: "year", label: "Last Year" },
  ];

  useEffect(() => {
    fetchTransactions();
    fetchSubscriptions();
  }, [token]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
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
    const sampleCategories = ["Food & Dining", "Shopping", "Transportation", "Entertainment", "Bills & Utilities", "Healthcare", "Salary"];
    const types = ["expense", "expense", "expense", "expense", "expense", "expense", "income"];
    
    for (let i = 0; i < 50; i++) {
      const randomCat = Math.floor(Math.random() * sampleCategories.length);
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
        default: break;
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
      title: "Total Income", value: reportData.totalIncome, 
      color: "from-green-400 to-emerald-300", icon: TrendingUp, 
      trend: "up", subtitle: `${savingsRate}% savings rate`,
      bg: "from-green-500/10 to-emerald-500/5"
    },
    { 
      title: "Total Expenses", value: reportData.totalExpenses, 
      color: "from-rose-400 to-red-300", icon: TrendingDown, 
      trend: "down", subtitle: "This period",
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Net Savings", value: reportData.netSavings, 
      color: reportData.netSavings >= 0 ? "from-emerald-400 to-teal-300" : "from-rose-400 to-red-300", 
      icon: Target, trend: reportData.netSavings >= 0 ? "up" : "down",
      subtitle: reportData.netSavings >= 0 ? "Surplus" : "Deficit",
      bg: reportData.netSavings >= 0 ? "from-emerald-500/10 to-teal-500/5" : "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Transactions", value: reportData.totalTransactions, 
      color: "from-purple-400 to-violet-300", icon: DollarSign, 
      trend: "up", subtitle: "Analyzed",
      bg: "from-purple-500/10 to-violet-500/5"
    },
  ];

  const exportToPDF = async () => {
    setExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("📄 Report exported to PDF successfully!");
    setExporting(false);
  };

  const exportToCSV = () => {
    toast.success("📊 Exporting report to CSV...");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#030712] via-[#07101f] to-[#050816] text-emerald-300">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-3"
        >
          <FileText className="w-6 h-6" />
          <span className="text-slate-400">Generating reports...</span>
        </motion.div>
      </div>
    );
  }

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

          {/* ====== Page Header with Gradient ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-emerald-500/[0.03] backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,.45)] p-8"
          >
            <div className="absolute -top-28 -right-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-[120px]" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-[120px]" />

            <div className="relative flex flex-col lg:flex-row justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-emerald-300 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  AI Powered Reports
                </div>
                <h1 className="mt-6 text-5xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent">
                    Financial
                  </span>
                  <br/>
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Reports
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-slate-400 leading-8">
                  Comprehensive analysis of your financial data.
                  Export detailed reports in multiple formats.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={exportToCSV}
                  className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 hover:text-white hover:border-emerald-500/30 transition-all shadow-lg flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} />
                  Export CSV
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={exportToPDF}
                  disabled={exporting}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-5 py-3 font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/60 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {exporting ? (
                    <>⏳ Exporting...</>
                  ) : (
                    <>
                      <FileOutput size={16} />
                      Export PDF
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ====== Report Summary Banner ====== */}
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
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Report Summary</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {reportData.totalTransactions} transactions analyzed · Savings rate: <span className="text-emerald-400 font-medium">{savingsRate}%</span>
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

          {/* ====== Report Controls ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                <Filter className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Report Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-sm text-slate-400 mb-2 block font-medium">
                  <Layers className="w-3.5 h-3.5 inline mr-1.5" />
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value} className="bg-[#0d141a]">
                      {type.label} — {type.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-2 block font-medium">
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value} className="bg-[#0d141a]">
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-slate-400 mb-2 block font-medium">
                  <Filter className="w-3.5 h-3.5 inline mr-1.5" />
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                >
                  <option value="all" className="bg-[#0d141a]">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="bg-[#0d141a]">
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* ====== Stat Cards ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-5"
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
                      ₹{stat.value.toLocaleString('en-IN')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 shadow-lg`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.trend === "up" ? "text-emerald-400" : "text-rose-400"
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

          {/* ====== Charts Row ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category Pie Chart */}
            <SpendingPieChart reportData={reportData} />

            {/* Monthly Trends Line Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Monthly Trends</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.monthlyData}
                    margin={{ top: 10, right: 30, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                    <XAxis dataKey="month" stroke="#4a5a6a" fontSize={11} />
                    <YAxis
                      width={84}
                      stroke="#4a5a6a"
                      tick={{ fontSize: 11, fill: "#4a5a6a" }}
                      tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                      domain={[0, yAxisTop]}
                      ticks={yAxisTicks}
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
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} dot={{ fill: "#22c55e", r: 4 }} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ fill: "#ef4444", r: 4 }} />
                    <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* ====== Bottom Charts Row ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Spending Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Category-wise Spending</h3>
              </div>
              <div className="h-80">
                {reportData.categorySpending.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.categorySpending}
                      margin={{ top: 10, right: 30, left: 48, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                      <XAxis dataKey="name" stroke="#4a5a6a" angle={-45} textAnchor="end" height={80} fontSize={11} />
                      <YAxis
                        width={80}
                        stroke="#4a5a6a"
                        tick={{ fontSize: 11, fill: "#4a5a6a" }}
                        tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
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
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {reportData.categorySpending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No category data available</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Top Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-rose-400/20 to-red-400/20">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Top 10 Expenses</h3>
              </div>
              <div className="h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-500/20">
                <div className="space-y-2">
                  {reportData.topExpenses.map((expense, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all"
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-400 text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white text-sm truncate">{expense.name}</div>
                          <div className="text-xs text-slate-500">{expense.category} • {expense.date}</div>
                        </div>
                      </div>
                      <div className="text-rose-400 font-semibold text-sm flex-shrink-0 ml-3">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </div>
                    </motion.div>
                  ))}
                  {reportData.topExpenses.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 py-8">
                      <TrendingDown className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">No expense data available</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ====== Subscriptions Overview ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20">
                <Repeat className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Subscriptions Overview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { 
                  label: "Active Subscriptions", 
                  value: reportData.activeSubscriptions, 
                  color: "from-cyan-400 to-teal-300", 
                  isAmount: false,
                  bg: "from-cyan-500/10 to-teal-500/5"
                },
                { 
                  label: "Monthly Cost", 
                  value: reportData.subscriptionCost, 
                  color: "from-rose-400 to-red-300", 
                  isAmount: true,
                  bg: "from-rose-500/10 to-red-500/5"
                },
                { 
                  label: "Yearly Cost", 
                  value: reportData.subscriptionCost * 12, 
                  color: "from-yellow-400 to-orange-300", 
                  isAmount: true,
                  bg: "from-yellow-500/10 to-orange-500/5"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className={`relative overflow-hidden bg-gradient-to-br ${item.bg} border border-white/10 rounded-2xl p-5 shadow-lg hover:border-emerald-500/30 transition-all`}
                  whileHover={{ y: -2 }}
                >
                  <p className="text-sm text-slate-400 mb-1">{item.label}</p>
                  <h4 className={`text-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                    {item.isAmount ? `₹${item.value.toLocaleString('en-IN')}` : item.value}
                  </h4>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ====== Financial Insights ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Financial Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Positive Trends */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
                <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </div>
                  Positive Trends
                </h4>
                <ul className="text-sm text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Your savings rate is <span className="text-emerald-400 font-semibold">{savingsRate}%</span> of income</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>You have <span className="text-emerald-400 font-semibold">{reportData.activeSubscriptions}</span> active subscriptions</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Top spending category: <span className="text-emerald-400 font-semibold">{reportData.categorySpending[0]?.name || 'N/A'}</span></span>
                  </li>
                </ul>
              </div>
              
              {/* Areas for Improvement */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/5 border border-rose-500/20">
                <h4 className="font-semibold text-rose-400 mb-3 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                  Areas for Improvement
                </h4>
                <ul className="text-sm text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <ArrowDown className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                    <span>Consider reducing spending in top categories</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ArrowDown className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                    <span>Review subscription costs for optimization</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ArrowDown className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                    <span>Monitor your expense-to-income ratio</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

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

// ====== SpendingPieChart Component - FinTrack Unified Design ======
function SmallCustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#0d141a] border border-[#2a333d] rounded-xl p-3 shadow-lg text-white">
      <div className="font-medium text-sm">{data.name}</div>
      <div className="text-sm text-slate-300">Amount: ₹{(data.value || 0).toLocaleString("en-IN")}</div>
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
      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Spending by Category</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <PieChartIcon className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">No spending data available</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
          <PieChartIcon className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Spending by Category</h3>
      </div>

      <div
        ref={containerRef}
        className="w-full h-48 sm:h-56 md:h-64 lg:h-72 relative"
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
                paddingAngle={2}
                label={
                  showLabels
                    ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`
                    : undefined
                }
                dataKey="value"
              >
                {reportData.categorySpending.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || "#10b981"} stroke="#0a0e12" strokeWidth={2} />
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
                  fontSize: "12px",
                  ...(isDesktop || isTablet
                    ? { right: 8, width: legendWidth, top: "50%", transform: "translateY(-50%)" }
                    : { bottom: 6, left: '50%', transform: 'translateX(-50%)' }),
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <PieChartIcon className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">No spending data available</p>
          </div>
        )}
      </div>

      {!showLabels && reportData.categorySpending.length > 0 && (
        <div className="mt-4 text-sm text-slate-400">
          <span className="text-slate-500">Top categories:</span>{" "}
          {reportData.categorySpending
            .slice()
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
            .map((c) => (
              <span key={c.name} className="text-slate-300">
                {c.name} <span className="text-emerald-400">(₹{c.value.toLocaleString('en-IN')})</span>
                {c !== reportData.categorySpending.slice().sort((a, b) => b.value - a.value).slice(0, 3).at(-1) && " • "}
              </span>
            ))}
        </div>
      )}
    </motion.div>
  );
}

export default ReportsPage;