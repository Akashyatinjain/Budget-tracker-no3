// FinanceDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import Papa from "papaparse";
import { useAuth, api } from "../context/AuthContext";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line, AreaChart,
  Area, Legend, ComposedChart
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet,
  Target, Calendar, ArrowUpRight,
  ArrowDownRight, PieChart as PieChartIcon,
  BarChart3, Download, PlusCircle, Import, Search,
  Sparkles, Shield, Zap, Crown, Activity,
  CreditCard, Home, ShoppingBag, Coffee,
  Award, Clock, Star, Gem
} from "lucide-react";

// ====== ImportButton Component ======
function ImportButton() {
  const fileRef = useRef();

  const openFilePicker = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data;
        try {
          const response = await api.post("/api/transactions/import", { rows });
          toast.success(`Imported ${response.data.inserted ?? response.data.insertedRows ?? 0} rows successfully!`);
        } catch (err) {
          console.error("Import failed:", err);
          toast.error("Import failed: " + (err?.response?.data?.message || err?.response?.data?.error || err.message));
        }
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        toast.error("CSV parse error: " + err.message);
      },
    });

    e.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileRef}
        onChange={handleFile}
        style={{ display: "none" }}
      />
      <button
        onClick={openFilePicker}
      className="
rounded-2xl
bg-gradient-to-r
from-emerald-500
via-green-500
to-lime-400
px-5
py-3
font-semibold
shadow-xl
shadow-emerald-500/30
hover:shadow-emerald-500/60
transition-all
"
      >
        <Import size={16} /> Import CSV
      </button>
      <button
        onClick={() => toast(
          "📌 Required CSV Columns:\n\n" +
          "• category_id\n" +
          "• type\n" +
          "• amount\n" +
          "• currency\n" +
          "• description\n" +
          "• merchant\n" +
          "• transaction_date\n\n" +
          "⚠️ Column names must match exactly!"
        )}
        className="
rounded-2xl
bg-gradient-to-r
from-emerald-500
via-green-500
to-lime-400
px-5
py-3
font-semibold
shadow-xl
shadow-emerald-500/30
hover:shadow-emerald-500/60
transition-all
"
      >
        CSV Format
      </button>
    </>
  );
}

// ====== Main Dashboard Component ======
const FinanceDashboard = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("month");
  const [pieChartRadius, setPieChartRadius] = useState(80);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [newTransaction, setNewTransaction] = useState({
    merchant: "",
    amount: "",
    category_id: "",
    type: "",
    currency: "INR",
    description: "",
    transaction_date: "",
  });

  // ====== Categories ======
  const categories = [
    { id: 1, name: "Food & Dining",    color: "#f43f5e", icon: Coffee },
    { id: 2, name: "Shopping",         color: "#8b5cf6", icon: ShoppingBag },
    { id: 3, name: "Transportation",   color: "#06b6d4", icon: Activity },
    { id: 4, name: "Entertainment",    color: "#f59e0b", icon: Star },
    { id: 5, name: "Bills & Utilities",color: "#84cc16", icon: Home },
    { id: 6, name: "Healthcare",       color: "#ef4444", icon: Shield },
    { id: 7, name: "Salary",           color: "#22c55e", icon: Award },
    { id: 8, name: "Investment",       color: "#3b82f6", icon: Gem },
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

  const getCategoryName = (id) => {
    if (!id) return "Unknown";
    const cat = getCategoryObj(id);
    return cat ? cat.name : (typeof id === "string" ? id : "Unknown");
  };

  const getCategoryColor = (id) => {
    if (!id) return "#6b7280";
    const cat = getCategoryObj(id);
    return cat ? cat.color : "#6b7280";
  };

  // ====== Fetch Transactions ======
  const fetchTransactions = async () => {
    if (!token) {
      setTransactions(getMockTransactions());
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/api/transactions");
      const data = res.data.transactions || res.data || [];
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        setTransactions(getMockTransactions());
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions(getMockTransactions());
    } finally {
      setLoading(false);
    }
  };

  const getMockTransactions = () => [
    { transaction_id: 1, merchant: "Punjab Grill",        category_id: 1, type: "expense", amount: 2450,  transaction_date: "2026-06-15" },
    { transaction_id: 2, merchant: "Monthly Salary",      category_id: 7, type: "income",  amount: 125000, transaction_date: "2026-06-01" },
    { transaction_id: 3, merchant: "Electricity Bill",    category_id: 5, type: "expense", amount: 3200,  transaction_date: "2026-06-10" },
    { transaction_id: 4, merchant: "PVR Cinemas",         category_id: 4, type: "expense", amount: 1200,  transaction_date: "2026-06-12" },
    { transaction_id: 5, merchant: "Amazon Shopping",     category_id: 2, type: "expense", amount: 8500,  transaction_date: "2026-06-08" },
    { transaction_id: 6, merchant: "Freelance Project",   category_id: 8, type: "income",  amount: 45000, transaction_date: "2026-06-05" },
    { transaction_id: 7, merchant: "Uber Ride",           category_id: 3, type: "expense", amount: 450,   transaction_date: "2026-06-14" },
    { transaction_id: 8, merchant: "MedPlus Pharmacy",    category_id: 6, type: "expense", amount: 780,   transaction_date: "2026-06-13" },
  ];

  // ====== Custom Label for Pie Chart ======
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" style={{ pointerEvents: "none", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // ====== Export CSV ======
  const exportCSV = () => {
    const headers = ["Date", "Merchant", "Category", "Type", "Amount"];
    const csvData = transactions.map(t => [
      t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "Unknown",
      t.merchant || "N/A",
      getCategoryName(t.category_id),
      t.type || "unknown",
      getSafeAmount(t)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  // ====== Filters ======
  const filteredTransactions = Array.isArray(transactions)
    ? transactions.filter(transaction =>
        (transaction.merchant?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        getCategoryName(transaction.category_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.type?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      )
    : [];

  useEffect(() => { fetchTransactions(); }, [token]);

  const getSafeAmount = (transaction) => {
    if (!transaction || transaction.amount === undefined || transaction.amount === null) return 0;
    return parseFloat(transaction.amount) || 0;
  };

  // ====== Calculations ======
  const totalIncome = Array.isArray(transactions)
    ? transactions.filter((t) => t?.type === "income").reduce((sum, t) => sum + getSafeAmount(t), 0)
    : 0;

  const totalExpenses = Array.isArray(transactions)
    ? transactions.filter((t) => t?.type === "expense").reduce((sum, t) => sum + getSafeAmount(t), 0)
    : 0;

  const totalBalance = totalIncome - totalExpenses;
  const savingsGoal = 50000;
  const goalProgress = Math.min((totalBalance / savingsGoal) * 100, 100);
  const savingsRate = totalIncome > 0 ? ((totalBalance / totalIncome) * 100) : 0;

  // ====== Monthly Data ======
  const getMonthlyData = () => {
    if (!Array.isArray(transactions)) return [];
    const monthlyData = {};
    transactions.forEach(transaction => {
      if (!transaction || !transaction.transaction_date) return;
      try {
        const date = new Date(transaction.transaction_date);
        if (isNaN(date.getTime())) return;
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            income: 0, expenses: 0,
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          };
        }
        const amount = getSafeAmount(transaction);
        if (transaction.type === 'income') monthlyData[monthYear].income += amount;
        else if (transaction.type === 'expense') monthlyData[monthYear].expenses += amount;
      } catch (error) {
        console.warn('Error processing transaction date:', error);
      }
    });
    return Object.values(monthlyData).slice(-6);
  };

  // ====== Weekly Spending ======
  const getWeeklySpending = () => {
    if (!Array.isArray(transactions)) {
      return Array.from({ length: 7 }, (_, i) => ({
        day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        amount: 0
      }));
    }
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), amount: 0 };
    }).reverse();

    transactions.forEach(transaction => {
      if (!transaction || transaction.type !== "expense") return;
      try {
        const amount = getSafeAmount(transaction);
        if (!amount) return;
        const transactionDate = new Date(transaction.transaction_date);
        if (isNaN(transactionDate.getTime())) return;
        const today = new Date();
        const diffDays = Math.floor((today - transactionDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) weeklyData[6 - diffDays].amount += amount;
      } catch (error) {
        console.warn('Error processing transaction for weekly spending:', error);
      }
    });
    return weeklyData;
  };

  // ====== Add Transaction ======
  const handleAddTransaction = async () => {
    try {
      await api.post("/api/transactions", newTransaction);
      toast.success("✨ Transaction Added Successfully!");
      setShowAddModal(false);
      setNewTransaction({ merchant: "", amount: "", category_id: "", type: "", currency: "INR", description: "", transaction_date: "" });
      fetchTransactions();
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to add transaction.");
    }
  };

  // ====== Expense by Category ======
  const expenseByCategory = Array.isArray(transactions)
    ? categories.map((cat) => ({
        name: cat.name,
        value: transactions
          .filter((t) => String(t?.type || "").toLowerCase() === "expense" && getCategoryObj(t?.category_id || t?.category || t?.category_name)?.id === cat.id)
          .reduce((sum, t) => sum + getSafeAmount(t), 0),
        color: cat.color,
      })).filter((c) => c.value > 0)
    : [];

  // ====== Recent Transactions ======
  const recentTransactions = Array.isArray(filteredTransactions)
    ? filteredTransactions.slice().reverse().slice(0, 6)
    : [];

  // ====== Responsive ======
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
  }, [mobileSidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) setPieChartRadius(100);
      else if (window.innerWidth < 768) setPieChartRadius(90);
      else setPieChartRadius(80);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ====== Animation Variants ======
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
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



  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/5 blur-[120px]" />
      </div>
      {/* Sidebar */}
      <AdvancedSidebar
        user={user || { username: "Guest" }}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 h-1.5 w-1.5 rounded-full bg-emerald-400/60 animate-pulse"/>
          <div className="absolute bottom-40 right-20 h-1.5 w-1.5 rounded-full bg-cyan-400/60 animate-ping"/>
          <div className="absolute top-72 right-1/3 h-2 w-2 rounded-full bg-teal-400/60 animate-pulse"/>
        </div>
        <main className="p-3 md:p-6 mt-14 flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[180px]" />
          <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[180px]" />
          
          {/* ====== Page Header ====== */}
          <motion.div
            initial={{opacity:0,y:10}}
            animate={{opacity:1,y:0}}
            transition={{duration:.3}}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1"
          >
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Welcome back, {user?.username || "User"} 👋
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Here is your real-time financial overview and recent activity.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Add Transaction
            </button>
          </motion.div>

          {/* ====== Summary Cards Grid with Net Worth HERO ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-12 gap-4"
          >
            {/* HERO CARD: Net Worth (Spans 5 cols on desktop) */}
            <motion.div
              variants={itemVariants}
              className="md:col-span-6 lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-[#0d1827] to-[#09101d] border-2 border-emerald-500/40 rounded-2xl p-5 md:p-6 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between group"
              whileHover={{ y: -3, scale: 1.005 }}
            >
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/15 blur-[50px] pointer-events-none" />
              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Total Net Worth
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 animate-pulse">
                    Highest Ever ✨
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="relative">
                <p className="text-xs text-slate-400 font-medium">Current Balance</p>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
                  ₹{totalBalance.toLocaleString("en-IN")}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    ↑ +12.8%
                  </span>
                  <span className="text-xs text-slate-400">vs last month ({savingsRate.toFixed(1)}% saved)</span>
                </div>
              </div>
            </motion.div>

            {/* SECONDARY CARDS: Income, Expenses, Savings Goal (Story-telling micro-insights) */}
            <div className="md:col-span-6 lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Income */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -2 }}
                className="bg-[#0b121e]/80 border border-white/[0.06] rounded-2xl p-4 shadow-sm hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-medium">🟢 Income</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">
                    ₹{totalIncome.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                    <span>↑ +18%</span>
                    <span className="text-slate-500 font-normal">vs last month</span>
                  </p>
                </div>
              </motion.div>

              {/* Expenses */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -2 }}
                className="bg-[#0b121e]/80 border border-white/[0.06] rounded-2xl p-4 shadow-sm hover:border-rose-500/30 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-medium">🔴 Expenses</span>
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">
                    ₹{totalExpenses.toLocaleString("en-IN")}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                    <span>↓ 8%</span>
                    <span className="text-emerald-300 font-normal">Good job! 🎉</span>
                  </p>
                </div>
              </motion.div>

              {/* Savings Goal */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -2 }}
                className="bg-[#0b121e]/80 border border-white/[0.06] rounded-2xl p-4 shadow-sm hover:border-purple-500/30 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">🟣 Goal Target</span>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xl font-bold text-slate-100">
                      {goalProgress.toFixed(0)}%
                    </h3>
                    <span className="text-[10px] text-purple-300 font-medium">On track 🎯</span>
                  </div>
                  <div className="w-full bg-[#17202e] rounded-full h-1.5 overflow-hidden mt-2">
                    <motion.div
                      className="h-full bg-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${goalProgress}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ====== Charts Row ====== */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Monthly Trends */}
            <motion.div
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4.5 md:p-5 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Monthly Trends</h3>
                <span className="ml-auto text-xs text-slate-500 bg-[#1a2228] px-2.5 py-1 rounded-full">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={getMonthlyData()} margin={{ top: 20, right: 15, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                  <XAxis dataKey="month" stroke="#4a5a6a" fontSize={11} />
                  <YAxis
                    width={48}
                    stroke="#4a5a6a"
                    fontSize={11}
                    domain={[0, (dataMax) => Math.ceil(dataMax * 1.25 || 1000)]}
                    tickFormatter={(v) => {
                      if (!v || v === 0) return "₹0";
                      if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                      if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
                      if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                      return `₹${v}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d141a",
                      border: "1px solid #2a333d",
                      borderRadius: "12px",
                      padding: "10px",
                    }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpenses)" dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Weekly Spending */}
            <motion.div
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4.5 md:p-5 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Weekly Spending</h3>
                <span className="ml-auto text-xs text-slate-500 bg-[#1a2228] px-2.5 py-1 rounded-full">This week</span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getWeeklySpending()} margin={{ top: 20, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                  <XAxis dataKey="day" stroke="#4a5a6a" fontSize={11} />
                  <YAxis
                    width={48}
                    stroke="#4a5a6a"
                    fontSize={11}
                    domain={[0, (dataMax) => Math.ceil(dataMax * 1.25 || 1000)]}
                    tickFormatter={(v) => {
                      if (!v || v === 0) return "₹0";
                      if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                      if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
                      if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                      return `₹${v}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d141a",
                      border: "1px solid #2a333d",
                      borderRadius: "12px",
                      padding: "10px",
                    }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {getWeeklySpending().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={categories[index % categories.length].color}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* ====== Bottom Section ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Expense Distribution */}
            <motion.div
              className="lg:col-span-1 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4.5 md:p-5 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
                  <PieChartIcon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Expense Distribution</h3>
              </div>

              {expenseByCategory.length > 0 ? (
                <>
                  <div className="w-full h-48 sm:h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={pieChartRadius}
                          labelLine={false}
                          label={CustomLabel}
                          paddingAngle={2}
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0a0e12" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0d141a",
                            border: "1px solid #2a333d",
                            borderRadius: "12px",
                            padding: "10px",
                          }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                    {expenseByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                          <span className="text-xs text-slate-300 font-semibold truncate">{category.name}</span>
                        </div>
                        <span className="text-xs text-emerald-400 font-mono font-bold ml-2 flex-shrink-0">
                          ₹{category.value.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <PieChartIcon className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs">No expense data available</p>
                </div>
              )}
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              className="lg:col-span-2 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4.5 md:p-5 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-white">Recent Transactions</h3>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {filteredTransactions.length} transactions
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-7 w-7 border-2 border-emerald-500 border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((t, idx) => (
                      <motion.div
                        key={t.transaction_id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/10/40 hover:border-emerald-500/30 hover:shadow-lg transition-all group"
                        whileHover={{ scale: 1.005 }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="p-2 rounded-xl flex-shrink-0"
                            style={{ backgroundColor: `${getCategoryColor(t.category_id)}20` }}
                          >
                            {t.type === "income" ? (
                              <ArrowUpRight className="w-4 h-4" style={{ color: getCategoryColor(t.category_id) }} />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" style={{ color: getCategoryColor(t.category_id) }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white text-sm truncate">{t.merchant || "Unknown Merchant"}</p>
                            <p className="text-xs text-slate-500">{getCategoryName(t.category_id)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className={`font-semibold text-sm ${t.type === "income" ? "text-green-400" : "text-rose-400"}`}>
                            {t.type === "income" ? "+" : "-"}₹{getSafeAmount(t).toLocaleString("en-IN")}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "Unknown"}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                      <Search className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-xs">
                        {searchTerm ? "No transactions match your search." : "No transactions found."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* ====== Footer Branding ====== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-6 border-t border-white/10/40"
          >
            <p className="text-xs text-slate-500">
              <span className="text-emerald-400 font-medium">FinTrack</span> — Trusted by finance professionals across India
            </p>
          </motion.div>
        </main>

        {/* ====== Add Transaction Modal ====== */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white/[0.04]
backdrop-blur-2xl
border
border-white/10 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                    <PlusCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Add Transaction</h2>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Merchant"
                    value={newTransaction.merchant}
                    onChange={(e) => setNewTransaction({ ...newTransaction, merchant: e.target.value })}
                    className="w-full p-3 bg-white/[0.03]
backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    className="w-full p-3 bg-white/[0.03]
backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <select
                    value={newTransaction.category_id}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                    className="w-full p-3 bg-white/[0.03]
backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                    className="w-full p-3 bg-white/[0.03]
backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="">Select Type</option>
                    <option value="income" className="text-green-400">Income</option>
                    <option value="expense" className="text-rose-400">Expense</option>
                  </select>
                  <input
                    type="date"
                    value={newTransaction.transaction_date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                    className="w-full p-3 bg-white/[0.03]
backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="w-full p-3 bg-white/[0.03]
backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none h-20"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="
rounded-2xl
bg-gradient-to-r
from-emerald-500
via-green-500
to-lime-400
px-5
py-3
font-semibold
shadow-xl
shadow-emerald-500/30
hover:shadow-emerald-500/60
transition-all
"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTransaction}
                    className="
rounded-2xl
bg-gradient-to-r
from-emerald-500
via-green-500
to-lime-400
px-5
py-3
font-semibold
shadow-xl
shadow-emerald-500/30
hover:shadow-emerald-500/60
transition-all
"
                  >
                    Add Transaction
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FinanceDashboard;