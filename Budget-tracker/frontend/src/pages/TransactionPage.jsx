// TransactionPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { 
  Plus, Search, Filter, X, Edit3, Trash2, 
  TrendingUp, TrendingDown, DollarSign, Zap, Shield,
  Clock, Sparkles, ArrowUpRight, ArrowDownRight,
  Wallet, Receipt, SlidersHorizontal, RotateCcw,
  Calendar, Tag, FileText, CreditCard
} from "lucide-react";
import { useAuth, api } from "../context/AuthContext";

const TransactionPage = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    merchant: "",
    category_id: "",
    type: "expense",
    amount: "",
    currency: "INR",
    transaction_date: "",
    description: "",
  });
  const [editTransaction, setEditTransaction] = useState(null);

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

  const getCategoryName = (id) => {
    const cat = categories.find((c) => String(c.id) === String(id));
    return cat ? cat.name : "Unknown";
  };

  const getCategoryColor = (id) => {
    const cat = categories.find((c) => String(c.id) === String(id));
    return cat ? cat.color : "#6b7280";
  };

  const getCategoryIcon = (id) => {
    const cat = categories.find((c) => String(c.id) === String(id));
    return cat ? cat.icon : "📋";
  };

  const safeParseAmount = (val) => {
    if (val == null) return 0;
    const v = typeof val === "object" ? val.amount : val;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const normalizeTransactionsResponse = (resData) => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData.transactions)) return resData.transactions;
    if (Array.isArray(resData.data)) return resData.data;
    return [];
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  useEffect(() => {
    document.body.style.overflow =
      mobileSidebarOpen || showModal || showEditModal ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showModal, showEditModal]);

  const fetchTransactions = async () => {
    if (!token) return;
    try {
      const res = await api.get("/api/transactions");
      const list = normalizeTransactionsResponse(res.data);
      setTransactions(list);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setTransactions([]);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/transactions", newTransaction);
      toast.success("✨ Transaction added successfully!");
      await fetchTransactions();
      setShowModal(false);
      setNewTransaction({
        merchant: "",
        category_id: "",
        type: "expense",
        amount: "",
        currency: "INR",
        transaction_date: "",
        description: "",
      });
    } catch (err) {
      console.error("Add transaction error:", err);
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Failed to add transaction.");
    }
  };

  const handleEditClick = (t) => {
    const id = Number(t.transaction_id ?? t.id);
    setEditTransaction({
      id: Number.isFinite(id) ? id : null,
      merchant: t.merchant ?? "",
      category_id: t.category_id ?? "",
      type: t.type ?? "expense",
      amount: t.amount ?? "",
      currency: t.currency ?? "INR",
      transaction_date: t.transaction_date
        ? (typeof t.transaction_date === "string"
            ? t.transaction_date.split("T")[0]
            : new Date(t.transaction_date).toISOString().slice(0, 10))
        : "",
      description: t.description ?? "",
    });
    setShowEditModal(true);
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!editTransaction || !editTransaction.id) return;

    const id = Number(editTransaction.id);
    if (!Number.isFinite(id)) return;

    const payload = {
      merchant: editTransaction.merchant,
      amount: editTransaction.amount,
      category_id: editTransaction.category_id,
      type: editTransaction.type,
      transaction_date: editTransaction.transaction_date,
      description: editTransaction.description,
      currency: editTransaction.currency,
    };

    try {
      await api.put(`/api/transactions/${id}`, payload);
      toast.success("Transaction updated!");
      await fetchTransactions();
      setShowEditModal(false);
      setEditTransaction(null);
    } catch (err) {
      console.error("Update transaction error:", err);
      toast.error("Failed to update transaction.");
    }
  };

  const handleDeleteTransaction = async (id) => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    try {
      await api.delete(`/api/transactions/${numericId}`);
      toast.success("Transaction deleted!");
      setTransactions((prev) => prev.filter((t) => (t.transaction_id ?? t.id) !== numericId));
      await fetchTransactions();
    } catch (err) {
      console.error("Delete transaction error:", err);
      toast.error("Failed to delete transaction.");
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const filteredTransactions = safeTransactions
    .filter((t) => {
      if (!t) return false;
      if (filter === "all") return true;
      const type = (t.type || "").toString().toLowerCase();
      return type === filter;
    })
    .filter((t) => {
      if (categoryFilter === "all") return true;
      return String(t.category_id) === String(categoryFilter);
    })
    .filter((t) => {
      const merchant = (t.merchant || "").toString().toLowerCase();
      return merchant.includes(searchQuery.toString().toLowerCase());
    });

  const totalBalance = safeTransactions.reduce((sum, t) => {
    const amt = safeParseAmount(t.amount ?? t);
    return (t?.type === "income") ? sum + amt : sum - amt;
  }, 0);

  const totalIncome = safeTransactions
    .filter((t) => (t?.type || "").toString().toLowerCase() === "income")
    .reduce((s, t) => s + safeParseAmount(t.amount ?? t), 0);

  const totalExpenses = safeTransactions
    .filter((t) => (t?.type || "").toString().toLowerCase() === "expense")
    .reduce((s, t) => s + safeParseAmount(t.amount ?? t), 0);

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date)) return "-";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

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
      title: "Net Worth", value: totalBalance, 
      color: totalBalance >= 0 ? "from-emerald-400 to-teal-300" : "from-rose-400 to-red-300", 
      icon: Wallet, trend: totalBalance >= 0 ? "up" : "down",
      subtitle: totalBalance >= 0 ? "Positive balance" : "Negative balance",
      bg: totalBalance >= 0 ? "from-emerald-500/10 to-teal-500/5" : "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Total Income", value: totalIncome, 
      color: "from-green-400 to-emerald-300", icon: TrendingUp, 
      trend: "up", subtitle: "All time earnings",
      bg: "from-green-500/10 to-emerald-500/5"
    },
    { 
      title: "Total Expenses", value: totalExpenses, 
      color: "from-rose-400 to-red-300", icon: TrendingDown, 
      trend: "down", subtitle: "All time spending",
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "Transactions", value: safeTransactions.length, 
      color: "from-purple-400 to-violet-300", icon: Receipt, 
      trend: "up", subtitle: "Total records",
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
                  Transaction Manager
                </div>
                <h1 className="mt-6 text-5xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent">
                    Transactions
                  </span>
                  <br/>
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    & Records
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-slate-400 leading-8">
                  Manage your income and expenses efficiently.
                  Track every rupee in one place.
                </p>
              </div>

              <div className="flex items-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowModal(true)}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-5 py-3 font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/60 transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Transaction
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ====== Transaction Summary Banner ====== */}
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
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Transaction Summary</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {safeTransactions.length} total transactions · Net: <span className={totalBalance >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>₹{Math.abs(totalBalance).toLocaleString("en-IN")}</span>
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
                      ₹{Number(stat.value || 0).toLocaleString("en-IN")}
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

          {/* ====== Filters Bar ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="min-w-[130px] p-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="all" className="bg-[#0d141a]">All Types</option>
                    <option value="income" className="bg-[#0d141a]">💰 Income</option>
                    <option value="expense" className="bg-[#0d141a]">💳 Expense</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="min-w-[160px] p-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="all" className="bg-[#0d141a]">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0d141a]">
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search merchant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setFilter("all"); setCategoryFilter("all"); setSearchQuery(""); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/5 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/30 transition-all flex items-center gap-2 flex-shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Filters
              </motion.button>
            </div>
          </motion.div>

          {/* ====== Transactions Table/List ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03] text-slate-400 text-xs uppercase">
                    <th className="py-4 px-5 text-left font-medium rounded-tl-2xl">Merchant</th>
                    <th className="py-4 px-5 text-left font-medium">Category</th>
                    <th className="py-4 px-5 text-left font-medium">Date</th>
                    <th className="py-4 px-5 text-left font-medium">Type</th>
                    <th className="py-4 px-5 text-right font-medium">Amount</th>
                    <th className="py-4 px-5 text-center font-medium rounded-tr-2xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t, index) => {
                      const id = t.transaction_id ?? t.id ?? Math.random();
                      const isIncome = (t?.type || "").toString().toLowerCase() === "income";
                      return (
                        <motion.tr
                          key={id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                {isIncome ? (
                                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <ArrowDownRight className="w-4 h-4 text-rose-400" />
                                )}
                              </div>
                              <span className="font-medium text-white">{t.merchant || "-"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${getCategoryColor(t.category_id)}20`,
                                color: getCategoryColor(t.category_id)
                              }}
                            >
                              {getCategoryIcon(t.category_id)} {getCategoryName(t.category_id)}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-slate-400 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-600" />
                              {formatDate(t.transaction_date)}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                              isIncome 
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" 
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/20"
                            }`}>
                              {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {t.type || "-"}
                            </span>
                          </td>
                          <td className={`py-4 px-5 font-semibold text-right whitespace-nowrap ${
                            isIncome ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {isIncome ? "+" : "-"}₹{Number(safeParseAmount(t.amount ?? t)).toLocaleString("en-IN")}
                          </td>
                          <td className="py-4 px-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditClick(t)}
                                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteTransaction(id)}
                                className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-20">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <Receipt className="w-12 h-12 mb-3 opacity-20" />
                          <p className="text-sm">
                            {searchQuery || filter !== "all" || categoryFilter !== "all" 
                              ? "No transactions match your filters." 
                              : "No transactions found. Add your first transaction!"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, index) => {
                  const id = t.transaction_id ?? t.id ?? Math.random();
                  const isIncome = (t?.type || "").toString().toLowerCase() === "income";
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2.5 rounded-xl flex-shrink-0 ${isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                            {isIncome ? (
                              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-rose-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-sm text-white truncate">{t.merchant || "-"}</h3>
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                                isIncome 
                                  ? "bg-emerald-500/20 text-emerald-400" 
                                  : "bg-rose-500/20 text-rose-400"
                              }`}>
                                {isIncome ? "+" : "-"}₹{Number(safeParseAmount(t.amount ?? t)).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span 
                                className="text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{ 
                                  backgroundColor: `${getCategoryColor(t.category_id)}20`,
                                  color: getCategoryColor(t.category_id)
                                }}
                              >
                                {getCategoryIcon(t.category_id)} {getCategoryName(t.category_id)}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(t.transaction_date)}
                              </span>
                            </div>
                            {t.description && (
                              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{t.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditClick(t)}
                            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteTransaction(id)}
                            className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Receipt className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">
                    {searchQuery || filter !== "all" || categoryFilter !== "all" 
                      ? "No transactions match your filters." 
                      : "No transactions found."}
                  </p>
                </div>
              )}
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

        {/* ====== Add Transaction Modal ====== */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">Add New Transaction</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Record a new income or expense</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Merchant</label>
                  <input
                    type="text"
                    placeholder="e.g., Amazon, Salary, Restaurant"
                    value={newTransaction.merchant}
                    onChange={(e) => setNewTransaction({ ...newTransaction, merchant: e.target.value })}
                    required
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                      required
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Type</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                    >
                      <option value="expense" className="bg-[#0d141a]">💳 Expense</option>
                      <option value="income" className="bg-[#0d141a]">💰 Income</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Date</label>
                    <input
                      type="date"
                      value={newTransaction.transaction_date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                      required
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Category</label>
                    <select
                      value={newTransaction.category_id}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                      required
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0d141a]">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#0d141a]">
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">
                    Description <span className="text-slate-600">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Add notes about this transaction..."
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                    rows={3}
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
                    Add Transaction
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ====== Edit Transaction Modal ====== */}
        {showEditModal && editTransaction && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
            onClick={() => { setShowEditModal(false); setEditTransaction(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                  <Edit3 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">Edit Transaction</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Update transaction details</p>
                </div>
                <button
                  onClick={() => { setShowEditModal(false); setEditTransaction(null); }}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTransaction} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Merchant</label>
                  <input
                    type="text"
                    placeholder="Merchant"
                    value={editTransaction.merchant}
                    onChange={(e) => setEditTransaction({ ...editTransaction, merchant: e.target.value })}
                    required
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={editTransaction.amount}
                      onChange={(e) => setEditTransaction({ ...editTransaction, amount: e.target.value })}
                      required
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Type</label>
                    <select
                      value={editTransaction.type}
                      onChange={(e) => setEditTransaction({ ...editTransaction, type: e.target.value })}
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                    >
                      <option value="expense" className="bg-[#0d141a]">💳 Expense</option>
                      <option value="income" className="bg-[#0d141a]">💰 Income</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Date</label>
                    <input
                      type="date"
                      value={editTransaction.transaction_date}
                      onChange={(e) => setEditTransaction({ ...editTransaction, transaction_date: e.target.value })}
                      required
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Category</label>
                    <select
                      value={editTransaction.category_id}
                      onChange={(e) => setEditTransaction({ ...editTransaction, category_id: e.target.value })}
                      required
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0d141a]">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#0d141a]">
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">
                    Description <span className="text-slate-600">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Description"
                    value={editTransaction.description}
                    onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })}
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditTransaction(null); }}
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
                    Update Transaction
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

export default TransactionPage;