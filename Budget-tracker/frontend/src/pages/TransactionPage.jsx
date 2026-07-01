// TransactionPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Filter, X, Edit3, Trash2, 
  TrendingUp, TrendingDown, DollarSign, Zap, Shield,
  Clock, Sparkles, ArrowUpRight, ArrowDownRight,
  Wallet, Receipt, SlidersHorizontal, RotateCcw,
  Calendar, Tag, FileText, CreditCard, ChevronLeft, ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../store/transactionSlice";

const TransactionPage = () => {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const { items: transactions, loading: reduxLoading } = useSelector((state) => state.transactions);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
    return cat ? cat.name : "Other";
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
    if (token) dispatch(fetchTransactions());
  }, [token, dispatch]);

  useEffect(() => {
    document.body.style.overflow =
      mobileSidebarOpen || showModal || showEditModal ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showModal, showEditModal]);

  const exportCSV = () => {
    if (!transactions || transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }
    const headers = ["Date", "Merchant", "Category", "Type", "Amount", "Description"];
    const csvData = transactions.map(t => [
      t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "Unknown",
      t.merchant || "N/A",
      getCategoryName(t.category_id),
      t.type || "unknown",
      t.amount || 0,
      t.description || ""
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addTransaction(newTransaction)).unwrap();
      toast.success("✨ Transaction added successfully!");
      dispatch(fetchTransactions());
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
      toast.error(typeof err === "string" ? err : "Failed to add transaction.");
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
      await dispatch(updateTransaction({ id, data: payload })).unwrap();
      toast.success("Transaction updated!");
      dispatch(fetchTransactions());
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
      await dispatch(deleteTransaction(numericId)).unwrap();
      toast.success("Transaction deleted!");
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

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, categoryFilter, searchQuery]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const avgTxn = safeTransactions.length > 0 ? Math.round((totalIncome + totalExpenses) / safeTransactions.length) : 0;

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date)) return "-";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.toString().split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-emerald-500/30 text-emerald-300 rounded px-1 font-bold">{part}</mark>
      ) : part
    );
  };

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
      title: "Net Worth", value: totalBalance, 
      color: totalBalance >= 0 ? "from-emerald-400 to-teal-300" : "from-rose-400 to-red-300", 
      icon: Wallet, trend: totalBalance >= 0 ? "up" : "down",
      subtitle: totalBalance >= 0 ? "Positive balance" : "Deficit balance",
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
      title: "Average Transaction", value: avgTxn, 
      color: "from-purple-400 to-violet-300", icon: Receipt, 
      trend: "up", subtitle: "Per transaction avg",
      bg: "from-purple-500/10 to-violet-500/5"
    },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[150px] animate-pulse" />
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

          {/* ====== Page Header (Compact Hero Banner - 15-20% shorter) ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-emerald-500/[0.03] backdrop-blur-2xl px-4 py-3 md:px-5 md:py-3.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Transactions &amp; Records</h1>
                <p className="text-[11px] text-slate-400">Manage income &amp; expenses efficiently.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-3 py-1.5 font-semibold text-xs text-white shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Add Transaction
              </button>
            </div>
          </motion.div>

          {/* ====== Useful Summary Banner ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 shadow-lg hover:border-emerald-500/40 transition-all"
            whileHover={{ y: -1 }}
          >
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Transaction Summary</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {safeTransactions.length} Total Records · Net: <span className={totalBalance >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>₹{Math.abs(totalBalance).toLocaleString("en-IN")}</span>
                  </p>
                </div>
              </div>
              
              {/* Useful Actionable Insights on Right Side */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-medium">Avg Txn</span>
                  <span className="font-bold text-emerald-300">₹{avgTxn.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-medium">Updated</span>
                  <span className="font-medium text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> Real-time
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ====== Stat Cards ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
          >
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg hover:border-emerald-500/30 transition-all group`}
                whileHover={{ y: -2 }}
              >
                <div className="relative flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{stat.title}</p>
                    <h2 className={`text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-1.5 truncate`}>
                      ₹{Number(stat.value || 0).toLocaleString("en-IN")}
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

          {/* ====== Filters Bar ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4 shadow-lg flex flex-col gap-3"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                {/* Active Filter Count Badge */}
                {((filter !== "all" ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0)) > 0 && (
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    {(filter !== "all" ? 1 : 0) + (categoryFilter !== "all" ? 1 : 0) + (searchQuery ? 1 : 0)} Active
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="min-w-[130px] p-2.5 bg-[#0d141e] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer hover:border-emerald-500/40"
                  >
                    <option value="all" className="bg-[#0d141a]">All Types</option>
                    <option value="income" className="bg-[#0d141a]">🟢 Income</option>
                    <option value="expense" className="bg-[#0d141a]">🔴 Expense</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="min-w-[160px] p-2.5 bg-[#0d141e] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer hover:border-emerald-500/40"
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search merchant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0d141e] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setFilter("all"); setCategoryFilter("all"); setSearchQuery(""); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/30 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Filters
              </motion.button>
            </div>

            {/* Filter Chips Display */}
            {((filter !== "all") || (categoryFilter !== "all") || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-xs text-slate-500">Active filters:</span>
                {filter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                    Type: {filter}
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setFilter("all")} />
                  </span>
                )}
                {categoryFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
                    Category: {categories.find(c => String(c.id) === String(categoryFilter))?.name || categoryFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setCategoryFilter("all")} />
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium">
                    Search: "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearchQuery("")} />
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* ====== Transactions Table/List ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-lg overflow-hidden flex flex-col"
          >
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto max-h-[500px]">
              <table className="min-w-full text-sm">
                {/* STICKY HEADER */}
                <thead className="sticky top-0 z-10 bg-[#07101f]/95 backdrop-blur-md border-b border-white/10 shadow-md">
                  <tr className="text-slate-400 text-xs uppercase">
                    <th className="py-3.5 px-5 text-left font-semibold">Merchant</th>
                    <th className="py-3.5 px-5 text-left font-semibold">Category</th>
                    <th className="py-3.5 px-5 text-left font-semibold">Date</th>
                    <th className="py-3.5 px-5 text-left font-semibold">Type</th>
                    <th className="py-3.5 px-5 text-right font-semibold">Amount</th>
                    <th className="py-3.5 px-5 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((t, index) => {
                      const id = t.transaction_id ?? t.id ?? Math.random();
                      const isIncome = (t?.type || "").toString().toLowerCase() === "income";
                      return (
                        <motion.tr
                          key={id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-white/[0.04] hover:scale-[1.001] transition-all duration-150 group cursor-pointer"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              {/* Category-based icon display for merchant */}
                              <div className="text-lg p-2 rounded-xl bg-white/5 border border-white/5">
                                {getCategoryIcon(t.category_id)}
                              </div>
                              <span className="font-semibold text-white">
                                {highlightMatch(t.merchant || "-", searchQuery)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1"
                              style={{ 
                                backgroundColor: `${getCategoryColor(t.category_id)}20`,
                                color: getCategoryColor(t.category_id)
                              }}
                            >
                              {getCategoryIcon(t.category_id)} {getCategoryName(t.category_id)}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-400 whitespace-nowrap text-xs font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {formatDate(t.transaction_date)}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              isIncome 
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}>
                              {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {t.type || "-"}
                            </span>
                          </td>
                          <td className={`py-3.5 px-5 font-bold text-right whitespace-nowrap text-base ${
                            isIncome ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            {isIncome ? "+" : "-"}₹{Number(safeParseAmount(t.amount ?? t)).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-16">
                        {/* Welcoming Empty State */}
                        <div className="flex flex-col items-center justify-center text-slate-400 max-w-sm mx-auto">
                          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20 shadow-lg">
                            <Receipt className="w-10 h-10" />
                          </div>
                          <h3 className="text-base font-bold text-white mb-1">No transactions found</h3>
                          <p className="text-xs text-slate-400 mb-4 text-center leading-relaxed">
                            {searchQuery || filter !== "all" || categoryFilter !== "all" 
                              ? "No transactions match your applied search filters." 
                              : "Start tracking your wealth by recording your first income or expense transaction."}
                          </p>
                          <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={14} /> Add Transaction
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/5">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t, index) => {
                  const id = t.transaction_id ?? t.id ?? Math.random();
                  const isIncome = (t?.type || "").toString().toLowerCase() === "income";
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="text-xl p-2 rounded-xl bg-white/5 border border-white/5 flex-shrink-0">
                            {getCategoryIcon(t.category_id)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-sm text-white truncate">
                                {highlightMatch(t.merchant || "-", searchQuery)}
                              </h3>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
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
                                {getCategoryName(t.category_id)}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(t.transaction_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditClick(t)}
                            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteTransaction(id)}
                            className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : null}
            </div>

            {/* Pagination Controls */}
            {filteredTransactions.length > 0 && (
              <div className="p-4 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div>
                  Showing <span className="text-white font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white font-semibold">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="text-white font-semibold">{filteredTransactions.length}</span> records
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === page
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                          : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* ====== Internal System Dashboard Footer ====== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500"
          >
            <div>
              <span className="text-emerald-400 font-bold">FinTrack Workspace</span> · v2.4.0 (Production Build)
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span>·</span>
              <span onClick={exportCSV} className="hover:text-white cursor-pointer transition-colors">Export Data</span>
              <span>·</span>
              <span className="hover:text-white cursor-pointer transition-colors">Shortcuts (Ctrl+K)</span>
            </div>
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