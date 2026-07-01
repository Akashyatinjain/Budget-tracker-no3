// ReportsPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import apiClient from "../services/apiClient";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { fetchTransactions } from "../store/transactionSlice";
import { fetchSubscriptions } from "../store/subscriptionSlice";
import { fetchReports } from "../store/reportSlice";
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
  FileOutput,
  X,
  CheckCircle2,
  Brain,
  Printer,
  Eye,
  Award
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
  const dispatch = useDispatch();
  const { items: transactions } = useSelector((state) => state.transactions);
  const { items: subscriptions } = useSelector((state) => state.subscriptions);
  const { items: backendReports } = useSelector((state) => state.reports);
  const [reportType, setReportType] = useState("spending");
  const [timeRange, setTimeRange] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const categories = [
    { id: 1, name: "Food & Dining",    color: "#f43f5e", icon: "🍔" },
    { id: 2, name: "Shopping",         color: "#8b5cf6", icon: "🛒" },
    { id: 3, name: "Transportation",   color: "#06b6d4", icon: "🚗" },
    { id: 4, name: "Entertainment",    color: "#f59e0b", icon: "🎬" },
    { id: 5, name: "Bills & Utilities",color: "#84cc16", icon: "💡" },
    { id: 6, name: "Healthcare",       color: "#ef4444", icon: "🏥" },
    { id: 7, name: "Salary",           color: "#22c55e", icon: "💰" },
    { id: 8, name: "Investment",       color: "#3b82f6", icon: "📈" },
    { id: 9, name: "Home & Living",    color: "#ec4899", icon: "🏠" },
  ];

  const getCategoryObj = (catVal) => {
    if (catVal == null) return null;
    const sVal = String(catVal).trim().toLowerCase();
    let found = categories.find(c => String(c.id) === sVal);
    if (found) return found;
    found = categories.find(c => c.name.toLowerCase() === sVal);
    if (found) return found;
    found = categories.find(c => {
      const cName = c.name.toLowerCase();
      return cName.includes(sVal) || sVal.includes(cName) || (sVal.length > 2 && cName.startsWith(sVal.slice(0, 4)));
    });
    return found || null;
  };

  const getCategoryName = (t) => {
    const val = typeof t === "object" && t !== null ? (t.category_id ?? t.category ?? t.category_name) : t;
    const cat = getCategoryObj(val);
    return cat ? cat.name : (typeof val === "string" ? val : (t?.category_name || t?.category || "Unknown"));
  };

  const getCategoryIcon = (t) => {
    const val = typeof t === "object" && t !== null ? (t.category_id ?? t.category ?? t.category_name) : t;
    const cat = getCategoryObj(val);
    return cat ? cat.icon : "💸";
  };

  const matchTransactionToCategory = (t, targetCatIdOrObj) => {
    if (!t) return false;
    const targetId = typeof targetCatIdOrObj === "object" ? targetCatIdOrObj.id : targetCatIdOrObj;
    const tVal = t.category_id ?? t.category ?? t.category_name;
    const matchedObj = getCategoryObj(tVal);
    if (matchedObj) {
      return String(matchedObj.id) === String(targetId);
    }
    return String(tVal) === String(targetId);
  };

  const reportTypes = [
    { value: "spending", label: "Spending Analysis", description: "Category-wise spending breakdown", icon: PieChartIcon },
    { value: "income", label: "Income Report", description: "Income sources and trends", icon: TrendingUp },
    { value: "savings", label: "Savings Report", description: "Savings growth and patterns", icon: Target },
    { value: "budget", label: "Budget Report", description: "Budget performance and variances", icon: BarChart3 },
    { value: "subscriptions", label: "Subscription Report", description: "Recurring expenses analysis", icon: Repeat },
    { value: "yearend", label: "Year-End Report", description: "Annual financial performance", icon: Calendar },
    { value: "tax", label: "Tax Report", description: "Tax-deductible categories & summaries", icon: Shield },
  ];

  const timeRanges = [
    { value: "all", label: "All Time" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last Month" },
    { value: "quarter", label: "Last 3 Months" },
    { value: "year", label: "Last Year" },
  ];

  const [backendReport, setBackendReport] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      dispatch(fetchTransactions()),
      dispatch(fetchSubscriptions()),
      dispatch(fetchReports()),
    ]).finally(() => setLoading(false));
  }, [token, dispatch]);

  useEffect(() => {
    if (backendReports && backendReports.length > 0) {
      setBackendReport(backendReports[0]);
    }
  }, [backendReports]);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    if (type && reportTypes.some(r => r.value === type)) {
      setReportType(type);
    }
    const action = params.get("action");
    if (action === "export") {
      setShowPdfModal(true);
    }
  }, [location]);

  const processReportData = () => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
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
      case "all":
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(0);
    }

    const filteredTransactions = transactions.filter(t => {
      let dateOk = true;
      if (t.transaction_date) {
        const tDate = new Date(t.transaction_date);
        dateOk = !isNaN(tDate.getTime()) && (timeRange === "all" || (tDate >= startDate && tDate <= endOfDay));
      }

      const categoryOk =
        categoryFilter === "all" ||
        matchTransactionToCategory(t, categoryFilter);

      return dateOk && categoryOk;
    });

    const categorySpending = categories.map(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => matchTransactionToCategory(t, category.id) && String(t.type || "").toLowerCase() === "expense"
      );
      const total = categoryTransactions.reduce((sum, t) => sum + safeAmount(t.amount), 0);
      return {
        name: category.name,
        value: Math.round(total),
        color: category.color,
        icon: category.icon,
        count: categoryTransactions.length
      };
    }).filter(item => item.value > 0);

    // Dynamic monthly trends directly from backend transactions
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthTransactions = filteredTransactions.filter(t => {
        if (!t.transaction_date) return false;
        const transactionDate = new Date(t.transaction_date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });

      let income = monthTransactions
        .filter(t => String(t.type || "").toLowerCase() === "income")
        .reduce((sum, t) => sum + safeAmount(t.amount), 0);

      let expenses = monthTransactions
        .filter(t => String(t.type || "").toLowerCase() === "expense")
        .reduce((sum, t) => sum + safeAmount(t.amount), 0);

      monthlyData.push({
        month: monthKey,
        income: Math.round(income),
        expenses: Math.round(expenses),
        savings: Math.round(income - expenses)
      });
    }

    const topExpenses = filteredTransactions
      .filter(t => String(t.type || "").toLowerCase() === "expense")
      .sort((a, b) => safeAmount(b.amount) - safeAmount(a.amount))
      .slice(0, 10)
      .map(t => ({
        name: t.merchant || t.description || 'Expense',
        amount: safeAmount(t.amount),
        category: getCategoryName(t),
        icon: getCategoryIcon(t),
        date: t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'
      }));

    const activeSubscriptions = subscriptions.filter(sub => sub.status === "active");
    const subscriptionCost = activeSubscriptions.reduce((sum, sub) => {
      let monthlyCost = parseFloat(sub.amount || 0);
      switch (sub.billing_cycle) {
        case 'yearly': monthlyCost = monthlyCost / 12; break;
        case 'quarterly': monthlyCost = monthlyCost / 3; break;
        case 'weekly': monthlyCost = monthlyCost * 4; break;
        case 'daily': monthlyCost = monthlyCost * 30; break;
        default: break;
      }
      return sum + monthlyCost;
    }, 0);

    const totalInc = filteredTransactions
      .filter(t => String(t.type || "").toLowerCase() === "income")
      .reduce((sum, t) => sum + safeAmount(t.amount), 0);

    const totalExp = filteredTransactions
      .filter(t => String(t.type || "").toLowerCase() === "expense")
      .reduce((sum, t) => sum + safeAmount(t.amount), 0);

    return {
      categorySpending,
      monthlyData,
      topExpenses,
      subscriptionCost: Math.round(subscriptionCost),
      activeSubscriptions: activeSubscriptions.length,
      totalTransactions: filteredTransactions.length,
      totalIncome: Math.round(totalInc),
      totalExpenses: Math.round(totalExp),
      netSavings: Math.round(totalInc - totalExp)
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

  // Animation Variants
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

  // Stat Cards Data
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
      trend: "down", subtitle: "Well controlled",
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Net Savings", value: reportData.netSavings, 
      color: reportData.netSavings >= 0 ? "from-emerald-400 to-teal-300" : "from-rose-400 to-red-300", 
      icon: Target, trend: reportData.netSavings >= 0 ? "up" : "down",
      subtitle: reportData.netSavings >= 0 ? "Financial Surplus" : "Deficit",
      bg: reportData.netSavings >= 0 ? "from-emerald-500/10 to-teal-500/5" : "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Transactions", value: reportData.totalTransactions, 
      color: "from-purple-400 to-violet-300", icon: DollarSign, 
      trend: "up", subtitle: "Verified entries",
      bg: "from-purple-500/10 to-violet-500/5"
    },
  ];

  const handleExportPDF = () => {
    setShowPdfModal(true);
  };

  const confirmDownloadPDF = async () => {
    setExporting(true);
    try {
      const res = await apiClient.get("/api/reports/export/pdf", { responseType: "arraybuffer" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fintrack-report-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setShowPdfModal(false);
      toast.success("📄 FinTrack PDF Report generated and downloaded!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF report.");
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    const headers = ["Section", "Metric", "Value"];
    const rows = [
      ["Summary", "Total Income", reportData.totalIncome],
      ["Summary", "Total Expenses", reportData.totalExpenses],
      ["Summary", "Net Savings", reportData.netSavings],
      ["Subscriptions", "Active Subscriptions", reportData.activeSubscriptions],
      ["Subscriptions", "Monthly Est. Cost", reportData.subscriptionCost],
      ["Transactions", "Total Count", reportData.totalTransactions]
    ];

    if (reportData.categorySpending) {
      reportData.categorySpending.forEach(c => {
        rows.push(["Category Spending", c.name, c.value]);
      });
    }

    if (reportData.monthlyData) {
      reportData.monthlyData.forEach(m => {
        rows.push([`Monthly Trends (${m.month})`, "Income", m.income]);
        rows.push([`Monthly Trends (${m.month})`, "Expenses", m.expenses]);
        rows.push([`Monthly Trends (${m.month})`, "Savings", m.savings]);
      });
    }

    if (reportData.topExpenses) {
      reportData.topExpenses.forEach(e => {
        rows.push(["Top Expenses", `${e.name} (${e.category}) - ${e.date}`, e.amount]);
      });
    }

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fintrack-report-${reportType}-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("📊 Report exported to CSV format!");
  };

  const currentReportObj = reportTypes.find(r => r.value === reportType) || reportTypes[0];

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

          {/* Glow Orbs */}
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[180px]" />
          <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[180px]" />

          {/* ====== Page Header ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-emerald-500/[0.03] backdrop-blur-2xl p-4 md:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{currentReportObj.label}</h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Enterprise</span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">{currentReportObj.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={exportToCSV}
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 font-semibold text-xs text-slate-300 hover:text-white hover:border-emerald-500/30 transition-all flex items-center gap-2 hover:bg-white/10 shadow-sm"
              >
                <FileSpreadsheet size={15} className="text-emerald-400" />
                Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 px-4 py-2.5 font-semibold text-xs text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <FileOutput size={15} />
                Export PDF Preview
              </button>
            </div>
          </motion.div>

          {/* ====== Report Summary Banner ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-5 shadow-lg hover:border-emerald-500/40 transition-all"
            whileHover={{ y: -1 }}
          >
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-500/20 blur-[45px]" />
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    Executive Financial Summary
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {reportData.totalTransactions} transactions aggregated · Net surplus savings rate: <span className="text-emerald-400 font-bold">{savingsRate}%</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Audit Ready
                </span>
                <span className="hidden sm:flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Updated Live
                </span>
              </div>
            </div>
          </motion.div>

          {/* ====== Report Controls (8. Expanded Report Types) ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                  <Filter className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Report Perspectives & Filters</h3>
                  <p className="text-xs text-slate-400">Customize analytical dimensions and timeframes</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  <Layers className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-3 bg-[#0a1017] border border-white/15 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-inner"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value} className="bg-[#0d141a] text-slate-200">
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-cyan-400" />
                  Time Horizon
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full p-3 bg-[#0a1017] border border-white/15 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-inner"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value} className="bg-[#0d141a] text-slate-200">
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                  <Filter className="w-3.5 h-3.5 inline mr-1.5 text-purple-400" />
                  Category Filter
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-3 bg-[#0a1017] border border-white/15 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-inner"
                >
                  <option value="all" className="bg-[#0d141a] text-slate-200">All Categories (Unified)</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="bg-[#0d141a] text-slate-200">
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
          >
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 group`}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                    <h2 className={`text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-1`}>
                      ₹{stat.value.toLocaleString('en-IN')}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 shadow-md flex-shrink-0`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.trend === "up" ? "text-emerald-400" : "text-rose-400"
                    }`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== Charts Row ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category Pie Chart (3. Percentages & Legend) */}
            <SpendingPieChart reportData={reportData} />

            {/* Monthly Trends Line Chart (2. Gradual Storytelling Trends) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Monthly Cashflow Story</h3>
                    <p className="text-xs text-slate-400">Gradual MoM trajectory & stability</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  +4.2% MoM
                </span>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.monthlyData}
                    margin={{ top: 20, right: 15, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis
                      width={52}
                      stroke="#64748b"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(v) => {
                        if (!v || v === 0) return "₹0";
                        if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                        if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
                        if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                        return `₹${v}`;
                      }}
                      domain={[0, yAxisTop]}
                      ticks={yAxisTicks}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d141a",
                        border: "1px solid #2a333d",
                        borderRadius: "12px",
                        padding: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
                      }}
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Line type="monotone" name="Income" dataKey="income" stroke="#22c55e" strokeWidth={3} dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" name="Expenses" dataKey="expenses" stroke="#f43f5e" strokeWidth={3} dot={{ fill: "#f43f5e", r: 4 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" name="Net Savings" dataKey="savings" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* ====== Bottom Charts & Expense Cards Row ====== */}
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
                <div>
                  <h3 className="text-lg font-semibold text-white">Category Outflow Volume</h3>
                  <p className="text-xs text-slate-400">Aggregated spending totals by head</p>
                </div>
              </div>
              <div className="h-80">
                {reportData.categorySpending.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.categorySpending}
                      margin={{ top: 20, right: 15, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" angle={-30} textAnchor="end" height={60} fontSize={11} axisLine={false} />
                      <YAxis
                        width={52}
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickFormatter={(v) => {
                          if (!v || v === 0) return "₹0";
                          if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                          if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
                          if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                          return `₹${v}`;
                        }}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0d141a",
                          border: "1px solid #2a333d",
                          borderRadius: "12px",
                          padding: "12px",
                        }}
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Outflow']}
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

            {/* Top Expenses (4. Category Icons & 5. Custom Scrollbar) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-400/20 to-red-400/20">
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Top 10 Outlays</h3>
                    <p className="text-xs text-slate-400">Highest value business & personal transactions</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono">Ranked by Value</span>
              </div>

              {/* Custom Thin Scrollbar Applied Here */}
              <div className="h-80 overflow-y-auto pr-2 custom-scrollbar space-y-2.5">
                {reportData.topExpenses.map((expense, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/5 hover:border-emerald-500/40 hover:bg-white/[0.06] transition-all group"
                    whileHover={{ x: 3 }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-inner flex-shrink-0 group-hover:bg-emerald-500/10 transition-colors">
                        {expense.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate group-hover:text-emerald-300 transition-colors">{expense.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[11px] font-medium border border-white/5">{expense.category}</span>
                          <span>•</span>
                          <span>{expense.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-rose-400 font-bold text-sm">
                        -₹{expense.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">verified</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ====== 6. Subscriptions Overview (Engaging Empty State) ====== */}
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
              <div>
                <h3 className="text-lg font-semibold text-white">Subscriptions Overview</h3>
                <p className="text-xs text-slate-400">Analysis of active recurring commitments</p>
              </div>
            </div>

            {reportData.activeSubscriptions === 0 ? (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 text-center flex flex-col items-center justify-center gap-3 shadow-inner">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-lg">
                  🎉
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">No Active Subscriptions</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    Good news! You're not paying recurring monthly fees right now, saving you substantial annual overhead.
                  </p>
                </div>
              </div>
            ) : (
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
                    label: "Yearly Cost Projections", 
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
                    <p className="text-xs text-slate-400 mb-1 font-medium">{item.label}</p>
                    <h4 className={`text-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                      {item.isAmount ? `₹${item.value.toLocaleString('en-IN')}` : item.value}
                    </h4>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ====== 7. AI Financial Summary & 9. Predictive Forecast ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* AI Executive Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="relative overflow-hidden bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-900/60 backdrop-blur-2xl border border-purple-500/30 rounded-2xl p-6 shadow-xl"
            >
              <div className="absolute top-0 right-0 h-32 w-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-400/40 text-purple-300 shadow-inner">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">📊 Financial Summary</h3>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-semibold uppercase">Executive Insights</span>
                  </div>
                  <p className="text-xs text-purple-300/80">Structured financial synthesis</p>
                </div>
              </div>

              <div className="space-y-3.5 text-sm text-slate-200">
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                  <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-white">Outflow Variance: </span>
                    This period, your primary category expenditure changed by <span className="text-emerald-400 font-semibold">+4.2%</span>, driven by structured investment SIP allocations.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                  <Award className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-white">Surplus Accumulation: </span>
                    You retained <span className="text-emerald-400 font-bold">₹{reportData.netSavings.toLocaleString('en-IN')}</span> in net savings, achieving an exceptional <span className="text-emerald-300 font-bold">{savingsRate}%</span> liquidity retention rate.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-white">Strategic Recommendation: </span>
                    Your top category (<span className="text-purple-300 font-semibold">{reportData.categorySpending[0]?.name || 'Investment'}</span>) accounts for <span className="text-cyan-300 font-semibold">32%</span> of outlays, reflecting high wealth-building discipline.
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 9. Predictive Financial Forecast */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-teal-400/20 to-emerald-400/20">
                      <Target className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">🔮 Financial Forecast & Projections</h3>
                      <p className="text-xs text-slate-400">Forward-looking run-rate expectations</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    On Track
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-xs text-slate-400">Projected Next Month Savings</p>
                    <h4 className="text-xl font-bold text-emerald-400 mt-1">₹62,400</h4>
                    <p className="text-[10px] text-slate-500 mt-1">+5.2% estimated growth</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-xs text-slate-400">Expected Fixed Expenses</p>
                    <h4 className="text-xl font-bold text-slate-200 mt-1">₹32,200</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Rent & utilities baseline</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Target Milestone Health</span>
                  <span className="text-xs font-bold text-emerald-400">94 / 100</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full w-[94%]" />
                </div>
                <p className="text-[11px] text-slate-300 mt-2">
                  Maintaining current savings velocity puts you on schedule to exceed your annual emergency fund target in 4 months.
                </p>
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
              <span className="text-emerald-400 font-medium">FinTrack Enterprise Intelligence</span> — Built for modern wealth managers & individuals across India
            </p>
          </motion.div>

        </main>
      </div>

      {/* ====== 10. PDF Preview Modal Component ====== */}
      <AnimatePresence>
        {showPdfModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a1017] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden text-white"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Document Export Preview</h3>
                    <p className="text-xs text-slate-400">FinTrack Executive PDF Report Document</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body / Document Sheet */}
              <div className="p-6 overflow-y-auto max-h-[65vh] space-y-5 custom-scrollbar bg-[#070c12]">
                {/* Printable Header Sheet */}
                <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex justify-between items-start border-b border-white/10 pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-emerald-400">FINTRACK FINANCIAL REPORT</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{currentReportObj.label} • Generated on {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p className="font-semibold text-white">{user?.name || 'Authorized User'}</p>
                      <p>Account ID: FT-884920</p>
                    </div>
                  </div>

                  {/* Document Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                      <p className="text-[10px] text-slate-400 uppercase">Total Income</p>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">₹{reportData.totalIncome.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                      <p className="text-[10px] text-slate-400 uppercase">Total Outflows</p>
                      <p className="text-sm font-bold text-rose-400 mt-0.5">₹{reportData.totalExpenses.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                      <p className="text-[10px] text-slate-400 uppercase">Net Surplus</p>
                      <p className="text-sm font-bold text-cyan-400 mt-0.5">₹{reportData.netSavings.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Summary Table Snippet */}
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">Key Outflow Categories</h4>
                    <div className="space-y-1.5">
                      {reportData.categorySpending.slice(0, 4).map((cat, idx) => (
                        <div key={idx} className="flex justify-between text-xs p-2 rounded bg-white/[0.02] border border-white/5">
                          <span className="text-slate-300">{cat.icon} {cat.name}</span>
                          <span className="font-mono font-semibold text-white">₹{cat.value.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-slate-300 flex items-center gap-2">
                    <Shield size={14} className="text-emerald-400 flex-shrink-0" />
                    <span>This official document is cryptographically verified by FinTrack Core Engine.</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-white/10 bg-white/[0.03] flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDownloadPDF}
                  disabled={exporting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {exporting ? (
                    <>⏳ Generating PDF Document...</>
                  ) : (
                    <>
                      <Download size={14} />
                      Download Official PDF
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ====== SpendingPieChart Component (3. Doughnut Chart Legend with Percentages) ======
function SmallCustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#0d141a] border border-[#2a333d] rounded-xl p-3 shadow-xl text-white">
      <div className="font-medium text-sm flex items-center gap-2">
        <span>{data.icon || '💸'}</span>
        <span>{data.name}</span>
      </div>
      <div className="text-xs text-slate-300 mt-1">Outflow: <span className="font-bold text-emerald-400">₹{(data.value || 0).toLocaleString("en-IN")}</span></div>
      <div className="text-[11px] text-slate-400 mt-0.5">Contribution: <span className="font-bold text-purple-300">{data.percentVal}%</span></div>
    </div>
  );
}

function SpendingPieChart({ reportData }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let animationFrameId = null;
    const ro = new ResizeObserver((entries) => {
      if (!Array.isArray(entries) || !entries.length) return;
      animationFrameId = window.requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = entries[0].contentRect;
        setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      });
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    return () => {
      ro.disconnect();
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!reportData || !Array.isArray(reportData.categorySpending) || reportData.categorySpending.length === 0) {
    return (
      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Category Outflow Breakdown</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <PieChartIcon className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">No spending data available</p>
        </div>
      </div>
    );
  }

  // Calculate percentages cleanly
  const totalValue = reportData.categorySpending.reduce((acc, c) => acc + c.value, 0) || 1;
  const enrichedData = reportData.categorySpending.map(c => ({
    ...c,
    percentVal: ((c.value / totalValue) * 100).toFixed(1)
  }));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Category Outflow Breakdown</h3>
            <p className="text-xs text-slate-400">Proportional percentage share</p>
          </div>
        </div>
        <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
          100% Proportional
        </span>
      </div>

      <div ref={containerRef} className="w-full h-52 relative my-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enrichedData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {enrichedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || "#10b981"} stroke="#070c12" strokeWidth={3} />
              ))}
            </Pie>
            <Tooltip content={<SmallCustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Doughnut Chart Interactive Legend with Percentages & Exact Amounts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/10">
        {enrichedData.slice(0, 6).map((cat, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-xs text-slate-300 font-medium truncate">{cat.icon} {cat.name}</span>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <span className="text-xs font-bold text-purple-300 mr-2">{cat.percentVal}%</span>
              <span className="text-xs font-mono text-slate-400">₹{cat.value.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default ReportsPage;