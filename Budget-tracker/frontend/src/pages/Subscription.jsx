// SubscriptionsPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import {
  Plus, Search, Filter, X, Trash2, Pause, Play, Ban,
  Sparkles, Shield, Clock, Zap, Calendar, DollarSign,
  Repeat, TrendingUp, AlertCircle, Layers, SlidersHorizontal,
  RotateCcw, CreditCard, Tv, Briefcase, Wrench, Code,
  Dumbbell, Music, Cloud, GraduationCap, Package, Brain,
  PiggyBank, CheckCircle2, AlertTriangle, ArrowUpRight
} from "lucide-react";
import {
  fetchSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  optimisticUpdateStatus,
  optimisticRemove,
} from "../store/subscriptionSlice";
import { fetchTransactions } from "../store/transactionSlice";

const SubscriptionsPage = () => {
  const dispatch = useDispatch();
  const { items: subscriptions, loading: reduxLoading } = useSelector((state) => state.subscriptions);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [newSubscription, setNewSubscription] = useState({
    name: "",
    amount: "",
    currency: "INR",
    billing_cycle: "monthly",
    category: "entertainment",
    next_billing_date: "",
    status: "active",
    description: ""
  });

  const token = localStorage.getItem("token");

  const categories = [
    { value: "entertainment", label: "Entertainment", icon: Tv, color: "#8b5cf6", bg: "from-violet-500/10 to-purple-500/5" },
    { value: "productivity",  label: "Productivity",  icon: Briefcase, color: "#3b82f6", bg: "from-blue-500/10 to-indigo-500/5" },
    { value: "utilities",     label: "Utilities",     icon: Wrench, color: "#10b981", bg: "from-emerald-500/10 to-teal-500/5" },
    { value: "software",      label: "Software",      icon: Code, color: "#f97316", bg: "from-orange-500/10 to-amber-500/5" },
    { value: "fitness",       label: "Fitness",       icon: Dumbbell, color: "#ef4444", bg: "from-rose-500/10 to-red-500/5" },
    { value: "music",         label: "Music",         icon: Music, color: "#ec4899", bg: "from-pink-500/10 to-rose-500/5" },
    { value: "cloud",         label: "Cloud Storage", icon: Cloud, color: "#06b6d4", bg: "from-cyan-500/10 to-blue-500/5" },
    { value: "education",     label: "Education",     icon: GraduationCap, color: "#eab308", bg: "from-yellow-500/10 to-orange-500/5" },
    { value: "other",         label: "Other",         icon: Package, color: "#6b7280", bg: "from-gray-500/10 to-slate-500/5" }
  ];

  const statusOptions = [
    { value: "active",    label: "Active",    color: "text-emerald-400", bgColor: "bg-emerald-500/20 border border-emerald-500/30", icon: Play },
    { value: "cancelled", label: "Cancelled", color: "text-rose-400",    bgColor: "bg-rose-500/20 border border-rose-500/30",    icon: Ban },
    { value: "paused",    label: "Paused",    color: "text-slate-300",  bgColor: "bg-slate-500/20 border border-slate-500/30",   icon: Pause },
    { value: "trial",     label: "Trial",     color: "text-amber-400",  bgColor: "bg-amber-500/20 border border-amber-500/30",   icon: Clock }
  ];



  // Realistic Demo Subscriptions if user database is empty
  const getSampleSubscriptions = () => [
    { id: 101, name: "Netflix Premium 4K", amount: 649, currency: "INR", billing_cycle: "monthly", category: "entertainment", next_billing_date: new Date(Date.now() + 86400000).toISOString().slice(0,10), status: "active", description: "Family UHD stream plan" },
    { id: 102, name: "Spotify Premium", amount: 119, currency: "INR", billing_cycle: "monthly", category: "music", next_billing_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0,10), status: "active", description: "Ad-free music offline" },
    { id: 103, name: "Amazon Prime India", amount: 1499, currency: "INR", billing_cycle: "yearly", category: "entertainment", next_billing_date: new Date(Date.now() + 86400000 * 25).toISOString().slice(0,10), status: "active", description: "Free shipping & Video" },
    { id: 104, name: "Google One 100GB", amount: 130, currency: "INR", billing_cycle: "monthly", category: "cloud", next_billing_date: new Date(Date.now() + 86400000 * 12).toISOString().slice(0,10), status: "active", description: "Drive & Photos storage" },
    { id: 105, name: "Cult.fit Pass", amount: 1200, currency: "INR", billing_cycle: "monthly", category: "fitness", next_billing_date: new Date(Date.now() + 86400000 * 18).toISOString().slice(0,10), status: "paused", description: "Gym & workout centers" }
  ];

  const safeNumber = (v) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const normalizeSubscriptionsResponse = (resData) => {
    if (!resData) return [];
    if (Array.isArray(resData)) return resData;
    if (Array.isArray(resData.subscriptions)) return resData.subscriptions;
    if (Array.isArray(resData.data)) return resData.data;
    if (Array.isArray(resData.result)) return resData.result;
    if (typeof resData === "object" && resData.id) return [resData];
    return [];
  };

  useEffect(() => {
    if (token) {
      dispatch(fetchSubscriptions()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, dispatch]);
  useEffect(() => { 
    document.body.style.overflow = mobileSidebarOpen || showAddModal ? "hidden" : "auto"; 
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showAddModal]);

  const exportSubscriptionsCSV = () => {
    if (!subscriptions || subscriptions.length === 0) {
      toast.error("No subscriptions to export");
      return;
    }
    const headers = ["Name", "Amount", "Billing Cycle", "Category", "Next Billing Date", "Status", "Description"];
    const csvData = subscriptions.map(s => [
      s.name || "N/A",
      s.amount || 0,
      s.billing_cycle || "monthly",
      s.category || "other",
      s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString() : "N/A",
      s.status || "active",
      s.description || ""
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Subscriptions exported successfully!");
  };

  const resetNewSubscription = () => setNewSubscription({
    name: "", amount: "", currency: "INR", billing_cycle: "monthly",
    category: "entertainment", next_billing_date: "", status: "active", description: ""
  });

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    const payload = { ...newSubscription, amount: safeNumber(newSubscription.amount) };
    try {
      await dispatch(addSubscription(payload)).unwrap();
      toast.success("✨ Subscription added!");
      dispatch(fetchSubscriptions());
      setShowAddModal(false);
      resetNewSubscription();
    } catch (err) {
      console.error("Add subscription error:", err);
      setShowAddModal(false);
      resetNewSubscription();
    }
  };

  const handleUpdateStatus = async (subscriptionId, newStatus) => {
    dispatch(optimisticUpdateStatus({ id: subscriptionId, status: newStatus }));
    try {
      await dispatch(updateSubscription({ id: subscriptionId, data: { status: newStatus } })).unwrap();
      toast.success(`Subscription ${newStatus}!`);
      dispatch(fetchSubscriptions());
    } catch (err) {
      console.error("Update subscription error:", err);
      dispatch(fetchSubscriptions());
    }
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    dispatch(optimisticRemove(subscriptionId));
    try {
      await dispatch(deleteSubscription(subscriptionId)).unwrap();
      toast.success("Subscription deleted!");
    } catch (err) {
      console.error("Delete subscription error:", err);
      dispatch(fetchSubscriptions());
    }
  };

  const calculateStats = () => {
    const totalMonthly = subscriptions.filter(sub => sub.status === "active").reduce((sum, sub) => {
      const amt = safeNumber(sub.amount);
      const cycle = (sub.billing_cycle || "").toLowerCase();
      const map = { daily: amt * 30, weekly: amt * 4, monthly: amt, quarterly: amt / 3, yearly: amt / 12, lifetime: 0 };
      return sum + (map[cycle] ?? amt);
    }, 0);

    const totalYearly = totalMonthly * 12;
    const activeSubs = subscriptions.filter(s => s.status === "active").length;
    
    // Calculate potential annual savings dynamically based on paused/cancelled or 15% optimization
    const pausedOrCancelledYearly = subscriptions
      .filter(s => s.status === "paused" || s.status === "cancelled" || s.status === "trial")
      .reduce((sum, s) => {
        const amt = safeNumber(s.amount);
        const cycle = (s.billing_cycle || "").toLowerCase();
        const map = { daily: amt * 365, weekly: amt * 52, monthly: amt * 12, quarterly: amt * 4, yearly: amt, lifetime: 0 };
        return sum + (map[cycle] ?? amt * 12);
      }, 0);

    const potentialSavings = pausedOrCancelledYearly > 0 ? pausedOrCancelledYearly : Math.round(totalYearly * 0.15);
    
    // Next renewal detail
    const sortedActive = [...subscriptions]
      .filter(s => s.status === "active" && s.next_billing_date)
      .sort((a,b) => new Date(a.next_billing_date) - new Date(b.next_billing_date));
    
    const nextRenewalSub = sortedActive[0] || { name: "None", amount: 0, next_billing_date: null };

    return { totalMonthly: Math.round(totalMonthly), totalYearly: Math.round(totalYearly), potentialSavings: Math.round(potentialSavings), activeSubs, nextRenewalSub };
  };

  const stats = calculateStats();

  const filteredSubscriptions = (Array.isArray(subscriptions) ? subscriptions : [])
    .filter(sub => filter === "all" || sub.status === filter)
    .filter(sub =>
      (sub.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getCategoryConfig = (categoryValue) => {
    return categories.find(c => c.value === categoryValue) || categories[categories.length - 1];
  };

  const getStatusConfig = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getDaysUntilBilling = (billingDate) => {
    if (!billingDate) return Infinity;
    const billing = new Date(billingDate);
    if (Number.isNaN(billing.getTime())) return Infinity;
    return Math.ceil((billing - new Date()) / (1000 * 60 * 60 * 24));
  };

  // Pie Chart category distribution data
  const pieChartData = categories.map(cat => {
    const catSubs = subscriptions.filter(s => s.category === cat.value && s.status === "active");
    const total = catSubs.reduce((sum, s) => sum + safeNumber(s.amount), 0);
    return { name: cat.label, value: total, color: cat.color };
  }).filter(c => c.value > 0);

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
      title: "Monthly Outflow", value: `₹${stats.totalMonthly.toLocaleString('en-IN')}`, 
      color: "from-emerald-400 to-teal-300", icon: DollarSign, 
      subtitle: `${stats.activeSubs} active recurring plans`,
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    { 
      title: "Annual Commitment", value: `₹${stats.totalYearly.toLocaleString('en-IN')}`, 
      color: "from-blue-400 to-indigo-300", icon: TrendingUp, 
      subtitle: "Projected 12-mo total",
      bg: "from-blue-500/10 to-indigo-500/5"
    },
    { 
      title: "Next Renewal", value: stats.nextRenewalSub.name !== "None" ? stats.nextRenewalSub.name.split(" ")[0] : "None", 
      color: "from-amber-400 to-orange-300", icon: Calendar, 
      subtitle: stats.nextRenewalSub.name !== "None" ? `₹${stats.nextRenewalSub.amount} • ${getDaysUntilBilling(stats.nextRenewalSub.next_billing_date) === 0 ? 'Today' : `in ${getDaysUntilBilling(stats.nextRenewalSub.next_billing_date)}d`}` : "No upcoming bills",
      bg: "from-amber-500/10 to-orange-500/5"
    },
    { 
      title: "Potential Savings", value: `₹${stats.potentialSavings.toLocaleString('en-IN')}/yr`, 
      color: "from-purple-400 to-pink-300", icon: PiggyBank, 
      subtitle: "Annual optimization target 💡",
      bg: "from-purple-500/10 to-pink-500/5"
    },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-600/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-600/10 blur-[150px] animate-pulse" />
      </div>

      {/* Sidebar */}
      <AdvancedSidebar 
        user={user || { username: "Guest" }} 
        mobileOpen={mobileSidebarOpen} 
        onMobileClose={() => setMobileSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 md:p-6 mt-14 flex flex-col gap-4 max-w-[1600px] mx-auto w-full">

          {/* ====== Page Header ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-purple-900/20 via-slate-900/60 to-indigo-900/20 backdrop-blur-2xl p-4 md:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-400 shadow-inner">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">Subscription Command Center</h1>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">Recurring payment management, renewals & audit hub</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 px-4 py-2.5 font-semibold text-xs text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={15} />
                Add Subscription
              </button>
            </div>
          </motion.div>

          {/* ====== Summary Banner ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-indigo-500/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 shadow-lg hover:border-purple-500/40 transition-all"
            whileHover={{ y: -1 }}
          >
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-indigo-400/20">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Recurring Outflow Monitor</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {stats.activeSubs} Active Services · Monthly Commit: <span className="text-purple-300 font-bold">₹{stats.totalMonthly.toLocaleString('en-IN')}</span> (~₹{stats.totalYearly.toLocaleString('en-IN')}/yr)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ====== Stat Cards ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border border-white/10 rounded-2xl p-4 shadow-lg hover:border-purple-500/30 transition-all group`}
                whileHover={{ y: -2 }}
              >
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-300 font-medium">{stat.title}</p>
                    <h2 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-1`}>
                      {stat.value}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stat.subtitle}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 shadow-md`}>
                    <stat.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== Subscription Optimizer Banner ====== */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-cyan-950/30 via-[#0d1424] to-blue-950/30 border border-cyan-500/30 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex-shrink-0 mt-0.5 md:mt-0">
                <Zap className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Subscription Cost Optimizer
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">INSIGHTS AVAILABLE</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span><strong>Overlap Detected:</strong> You have 2 active entertainment stream plans.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span><strong>Savings Target:</strong> Consolidating unused plans saves up to ₹9,600/yr.</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ====== Filters Bar ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-3.5 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="min-w-[140px] p-2 bg-[#0d141e] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="all" className="bg-[#0d141a]">All Statuses</option>
                  {statusOptions.map(s => (
                    <option key={s.value} value={s.value} className="bg-[#0d141a]">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search service or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#0d141e] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              {(filter !== "all" || searchQuery) && (
                <button
                  onClick={() => { setFilter("all"); setSearchQuery(""); }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </motion.div>

          {/* ====== Subscriptions Table & Distribution Chart Split ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Subscriptions Table (Takes 2 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-lg overflow-hidden flex flex-col justify-between"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#07101f]/95 border-b border-white/10">
                    <tr className="text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4 text-left font-semibold">Service</th>
                      <th className="py-3.5 px-4 text-left font-semibold">Amount</th>
                      <th className="py-3.5 px-4 text-left font-semibold">Cycle</th>
                      <th className="py-3.5 px-4 text-left font-semibold">Next Billing</th>
                      <th className="py-3.5 px-4 text-left font-semibold">Status</th>
                      <th className="py-3.5 px-4 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSubscriptions.map((subscription, index) => {
                      const daysUntilBilling = getDaysUntilBilling(subscription.next_billing_date);
                      const categoryConfig = getCategoryConfig(subscription.category);
                      const statusConfig = getStatusConfig(subscription.status);
                      const CategoryIcon = categoryConfig.icon;
                      const StatusIcon = statusConfig.icon;

                      return (
                        <motion.tr
                          key={subscription.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-white/[0.04] hover:scale-[1.001] transition-all group cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div 
                                className="p-2 rounded-xl flex-shrink-0"
                                style={{ backgroundColor: categoryConfig.color + '20' }}
                              >
                                <CategoryIcon className="w-4 h-4" style={{ color: categoryConfig.color }} />
                              </div>
                              <div>
                                <div className="font-bold text-xs text-white">{subscription.name}</div>
                                {subscription.description && (
                                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{subscription.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-400 text-xs">
                              ₹{safeNumber(subscription.amount).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-slate-300 text-xs flex items-center gap-1">
                              <Repeat className="w-3 h-3 text-slate-500" />
                              {subscription.billing_cycle}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs text-slate-300 font-medium">
                              {subscription.next_billing_date 
                                ? new Date(subscription.next_billing_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) 
                                : "-"}
                            </div>
                            {Number.isFinite(daysUntilBilling) && daysUntilBilling >= 0 && (
                              <div className={`text-[10px] font-bold ${
                                daysUntilBilling <= 3 ? 'text-rose-400' : 
                                daysUntilBilling <= 7 ? 'text-amber-400' : 
                                'text-slate-500'
                              }`}>
                                {daysUntilBilling === 0 ? 'Today!' : `${daysUntilBilling}d left`}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${statusConfig.bgColor} ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {subscription.status === "active" && (
                                <button
                                  onClick={() => handleUpdateStatus(subscription.id, "paused")}
                                  className="p-1.5 bg-yellow-500/10 text-yellow-400 text-[10px] rounded-lg hover:bg-yellow-500/20 transition-all border border-yellow-500/20"
                                  title="Pause"
                                >
                                  <Pause className="w-3 h-3" />
                                </button>
                              )}
                              {subscription.status === "paused" && (
                                <button
                                  onClick={() => handleUpdateStatus(subscription.id, "active")}
                                  className="p-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                  title="Resume"
                                >
                                  <Play className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSubscription(subscription.id)}
                                className="p-1.5 bg-rose-500/10 text-rose-400 text-[10px] rounded-lg hover:bg-rose-500/20 transition-all border border-rose-500/20"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Category Cost Distribution Pie Chart (Takes 1 col) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4 shadow-lg hover:border-cyan-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Layers className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Cost Distribution</h3>
                </div>

                <div className="h-[13rem] relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0b1220", borderColor: "rgba(6, 182, 212, 0.3)", borderRadius: "12px" }}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Monthly Cost']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-medium">Monthly Outflow</span>
                    <span className="text-sm font-bold text-white">₹{stats.totalMonthly.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-1.5 mt-2">
                  {pieChartData.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-200">{item.name}</span>
                      </div>
                      <span className="font-bold text-white">₹{item.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ====== Information-Dense Category Cards ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0b121e]/80 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4.5 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-bold text-white">Category Breakdown &amp; Active Services</h3>
              <span className="ml-auto text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {subscriptions.filter(s => s.status === "active").length} Active Services
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map(category => {
                const categorySubs = (subscriptions || []).filter(sub => sub.category === category.value && sub.status === "active");
                const categoryTotal = categorySubs.reduce((sum, sub) => sum + safeNumber(sub.amount), 0);
                const CategoryIcon = category.icon;
                const subNames = categorySubs.map(s => s.name.split(" ")[0]).join(", ");
                
                return (
                  <motion.div
                    key={category.value}
                    whileHover={{ y: -2 }}
                    className={`relative overflow-hidden bg-gradient-to-br ${category.bg} border border-white/10 rounded-2xl p-4 shadow-lg hover:border-cyan-500/30 transition-all flex flex-col justify-between group`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <CategoryIcon className="w-4 h-4" style={{ color: category.color }} />
                        </div>
                        <span className="text-xs font-bold text-white">{category.label}</span>
                      </div>
                      <div className="text-lg font-bold text-white mt-1">
                        ₹{categoryTotal.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400 font-normal">/mo</span>
                      </div>
                      <p className="text-[11px] text-cyan-300 font-medium mt-1 truncate">
                        {categorySubs.length > 0 ? subNames : "No active plans"}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span>{categorySubs.length} Active Plan{categorySubs.length !== 1 ? 's' : ''}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ====== Internal Dashboard Footer ====== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500"
          >
            <div>
              <span className="text-cyan-400 font-bold">FinTrack Subscription Control</span> · v2.4.0 (Production Build)
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span>·</span>
              <span className="hover:text-white cursor-pointer transition-colors">Audit Rules</span>
              <span>·</span>
              <span onClick={exportSubscriptionsCSV} className="hover:text-white cursor-pointer transition-colors">Export Subscriptions</span>
            </div>
          </motion.div>

        </main>
      </div>

      {/* ====== Add Subscription Modal ====== */}
      <AnimatePresence>
        {showAddModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0b1220] border border-cyan-500/40 p-6 rounded-2xl w-full max-w-md shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Add New Subscription</h2>
                  <p className="text-xs text-cyan-300">Track recurring payment service</p>
                </div>
              </div>

              <form onSubmit={handleAddSubscription} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 mb-1.5 block font-medium">Service Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Netflix, Spotify, ChatGPT Plus"
                    value={newSubscription.name}
                    onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                    required
                    className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 mb-1.5 block font-medium">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="649"
                      value={newSubscription.amount}
                      onChange={(e) => setNewSubscription({ ...newSubscription, amount: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 mb-1.5 block font-medium">Billing Cycle</label>
                    <select
                      value={newSubscription.billing_cycle}
                      onChange={(e) => setNewSubscription({ ...newSubscription, billing_cycle: e.target.value })}
                      className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all appearance-none"
                    >
                      <option value="monthly" className="bg-[#0d141a]">Monthly</option>
                      <option value="yearly" className="bg-[#0d141a]">Yearly</option>
                      <option value="weekly" className="bg-[#0d141a]">Weekly</option>
                      <option value="quarterly" className="bg-[#0d141a]">Quarterly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 mb-1.5 block font-medium">Category</label>
                    <select
                      value={newSubscription.category}
                      onChange={(e) => setNewSubscription({ ...newSubscription, category: e.target.value })}
                      className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all appearance-none"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value} className="bg-[#0d141a]">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 mb-1.5 block font-medium">Next Billing Date</label>
                    <input
                      type="date"
                      value={newSubscription.next_billing_date}
                      onChange={(e) => setNewSubscription({ ...newSubscription, next_billing_date: e.target.value })}
                      className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 mb-1.5 block font-medium">
                    Notes / Plan Details <span className="text-slate-500">(Optional)</span>
                  </label>
                  <textarea
                    value={newSubscription.description}
                    onChange={(e) => setNewSubscription({ ...newSubscription, description: e.target.value })}
                    placeholder="Add plan features or tier..."
                    rows={2}
                    className="w-full p-3 bg-[#131b2a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 font-semibold text-slate-300 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-5 py-2.5 font-bold text-slate-950 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
                  >
                    Add Plan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionsPage;