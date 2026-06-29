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

  const getCategoryName = (id) => {
    if (!id) return "Unknown";
    const cat = categories.find((c) => parseInt(c.id) === parseInt(id));
    return cat ? cat.name : "Unknown";
  };

  const getCategoryColor = (id) => {
    if (!id) return "#6b7280";
    const cat = categories.find((c) => parseInt(c.id) === parseInt(id));
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
          .filter((t) => t?.type === "expense" && parseInt(t.category_id) === cat.id)
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

  // ====== Summary Cards Data ======
  const summaryCards = [
    { 
      title: "Net Worth", 
      value: totalBalance, 
      subtitle: `${savingsRate.toFixed(1)}% savings rate`,
      color: "from-emerald-400 to-teal-300", 
      icon: Wallet, 
      trend: totalBalance >= 0 ? "up" : "down",
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    { 
      title: "Income", 
      value: totalIncome, 
      subtitle: "This month",
      color: "from-green-400 to-emerald-300", 
      icon: TrendingUp, 
      trend: "up",
      bg: "from-green-500/10 to-emerald-500/5"
    },
    { 
      title: "Expenses", 
      value: totalExpenses, 
      subtitle: "This month",
      color: "from-rose-400 to-red-300", 
      icon: TrendingDown, 
      trend: "down",
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Savings Goal", 
      value: goalProgress, 
      subtitle: `${savingsGoal.toLocaleString('en-IN')} target`,
      color: "from-purple-400 to-violet-300", 
      icon: Target, 
      isProgress: true,
      bg: "from-purple-500/10 to-violet-500/5"
    },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br
from-[#030712]
via-[#07101f]
to-[#050816] text-white">

  {/* Animated Background */}
  <div className="absolute inset-0 -z-10">

    <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[140px] animate-pulse" />

    <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-[150px] animate-pulse" />

    <div className="absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/10 blur-[120px]" />

    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,.05),transparent_40%)]" />

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

<div className="absolute top-20 left-1/4 h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>

<div className="absolute bottom-40 right-20 h-2 w-2 rounded-full bg-cyan-400 animate-ping"/>

<div className="absolute top-72 right-1/3 h-3 w-3 rounded-full bg-teal-400 animate-pulse"/>

</div>
        <main className="p-4 md:p-8 mt-16 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[180px]" />

<div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[180px]" />
          
          {/* ====== Page Header with Gradient ====== */}
          <motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{duration:.5}}
className="relative overflow-hidden rounded-[32px]
border border-white/10
bg-gradient-to-br
from-white/[0.08]
via-white/[0.04]
to-emerald-500/[0.03]
backdrop-blur-2xl
shadow-[0_20px_80px_rgba(0,0,0,.45)]
p-8"
>

<div className="absolute -top-28 -right-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-[120px]" />

<div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-[120px]" />

<div className="relative flex flex-col lg:flex-row justify-between gap-8">

<div>

<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-emerald-300 text-sm font-semibold">

<Sparkles className="w-4 h-4"/>

AI Powered Finance Dashboard

</div>

<h1 className="mt-6 text-5xl font-black leading-tight">

<span className="bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent">

Master Your

</span>

<br/>

<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">

Financial Future

</span>

</h1>

<p className="mt-5 max-w-xl text-slate-400 leading-8">

Track every rupee.

Analyze your spending.

Reach your goals faster.

Everything in one beautiful dashboard.

</p>

</div>

<div className="grid grid-cols-2 gap-5">

<div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

<p className="text-slate-400 text-sm">

Portfolio

</p>

<h2 className="mt-2 text-4xl font-black text-emerald-400">

₹{totalBalance.toLocaleString("en-IN")}

</h2>

<p className="mt-2 text-green-400">

+12.8%

</p>

</div>

<div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

<p className="text-slate-400 text-sm">

Transactions

</p>

<h2 className="mt-2 text-4xl font-black text-cyan-400">

{transactions.length}

</h2>

<p className="mt-2 text-cyan-300">

This Month

</p>

</div>

</div>

</div>

</motion.div>


          {/* ====== Summary Cards ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {summaryCards.map((card, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${card.bg} border border-white/10/60 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 group`}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-300 font-medium">{card.title}</p>
                    <h2 className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent mt-1`}>
                      {card.isProgress
                        ? `${card.value.toFixed(1)}%`
                        : `₹${card.value.toLocaleString("en-IN")}`}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} bg-opacity-10 shadow-lg`}>
                    <card.icon className={`w-5 h-5 text-${card.trend === "up" ? "emerald" : card.trend === "down" ? "rose" : "purple"}-400`} />
                  </div>
                </div>
                
                {card.isProgress && (
                  <div className="relative mt-4">
                    <div className="w-full bg-[#1a2228] rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${card.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${card.value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                {/* Trend indicator */}
                {!card.isProgress && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1">
                    <span className={`text-xs font-medium ${card.trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                      {card.trend === "up" ? "↑" : "↓"}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* ====== Charts Row ====== */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <motion.div
              className="bg-white/[0.04]
backdrop-blur-2xl
border
border-white/10 border border-white/10/60 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Monthly Trends</h3>
                <span className="ml-auto text-xs text-slate-500 bg-[#1a2228] px-3 py-1 rounded-full">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getMonthlyData()}>
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
                  <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Weekly Spending */}
            <motion.div
              className="bg-white/[0.04]
backdrop-blur-2xl
border
border-white/10 border border-white/10/60 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Weekly Spending</h3>
                <span className="ml-auto text-xs text-slate-500 bg-[#1a2228] px-3 py-1 rounded-full">This week</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getWeeklySpending()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                  <XAxis dataKey="day" stroke="#4a5a6a" fontSize={11} />
                  <YAxis stroke="#4a5a6a" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d141a",
                      border: "1px solid #2a333d",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense Distribution */}
            <motion.div
              className="lg:col-span-1 bg-white/[0.04]
backdrop-blur-2xl
border
border-white/10 border border-white/10/60 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
                  <PieChartIcon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Expense Distribution</h3>
              </div>

              {expenseByCategory.length > 0 ? (
                <>
                  <div className="w-full h-56 sm:h-64">
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
                            padding: "12px",
                          }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20">
                    {expenseByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1a2228] transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                          <span className="text-sm text-gray-300">{category.name}</span>
                        </div>
                        <span className="text-sm text-emerald-300 font-medium">
                          ₹{category.value.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <PieChartIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No expense data available</p>
                </div>
              )}
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              className="lg:col-span-2 bg-white/[0.04]
backdrop-blur-2xl
border
border-white/10 border border-white/10/60 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  {filteredTransactions.length} transactions
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((t, idx) => (
                      <motion.div
                        key={t.transaction_id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-4 bg-white/[0.03]
backdrop-blur-xl rounded-xl border border-white/10/40 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className="p-2.5 rounded-xl flex-shrink-0"
                            style={{ backgroundColor: `${getCategoryColor(t.category_id)}20` }}
                          >
                            {t.type === "income" ? (
                              <ArrowUpRight className="w-4 h-4" style={{ color: getCategoryColor(t.category_id) }} />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" style={{ color: getCategoryColor(t.category_id) }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{t.merchant || "Unknown Merchant"}</p>
                            <p className="text-xs text-slate-500">{getCategoryName(t.category_id)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className={`font-semibold ${t.type === "income" ? "text-green-400" : "text-rose-400"}`}>
                            {t.type === "income" ? "+" : "-"}₹{getSafeAmount(t).toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "Unknown"}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <Search className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">
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