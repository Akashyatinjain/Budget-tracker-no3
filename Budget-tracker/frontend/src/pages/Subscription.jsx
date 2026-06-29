// SubscriptionsPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  X,
  Trash2,
  Pause,
  Play,
  Ban,
  Sparkles,
  Shield,
  Clock,
  Zap,
  Calendar,
  DollarSign,
  Repeat,
  TrendingUp,
  AlertCircle,
  Layers,
  SlidersHorizontal,
  RotateCcw,
  CreditCard,
  Tv,
  Briefcase,
  Wrench,
  Code,
  Dumbbell,
  Music,
  Cloud,
  GraduationCap,
  Package
} from "lucide-react";

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
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

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
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

  const billingCycles = [
    { value: "daily",    label: "Daily" },
    { value: "weekly",   label: "Weekly" },
    { value: "monthly",  label: "Monthly" },
    { value: "quarterly",label: "Quarterly" },
    { value: "yearly",   label: "Yearly" },
    { value: "lifetime", label: "Lifetime" }
  ];

  const statusOptions = [
    { value: "active",    label: "Active",    color: "text-emerald-400", bgColor: "bg-emerald-500/20", icon: Play },
    { value: "cancelled", label: "Cancelled", color: "text-rose-400",    bgColor: "bg-rose-500/20",    icon: Ban },
    { value: "paused",    label: "Paused",    color: "text-yellow-400",  bgColor: "bg-yellow-500/20",  icon: Pause },
    { value: "expired",   label: "Expired",   color: "text-slate-400",  bgColor: "bg-slate-500/20",   icon: Clock }
  ];

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const getSampleSubscriptions = () => [];

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

  useEffect(() => { fetchUser(); fetchSubscriptions(); }, []);
  useEffect(() => { 
    document.body.style.overflow = mobileSidebarOpen || showAddModal ? "hidden" : "auto"; 
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showAddModal]);

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      setUser(res.data?.user || res.data || null);
    } catch (err) { console.error("Fetch user error:", err); setUser(null); }
  };

  const fetchSubscriptions = async () => {
    if (!token) { setSubscriptions(getSampleSubscriptions()); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/subscriptions`, axiosConfig);
      const list = normalizeSubscriptionsResponse(res.data);
      const cleaned = list.map((s, i) => ({
        id: s.id ?? Date.now() + i,
        name: s.name ?? "Unknown",
        amount: safeNumber(s.amount),
        currency: s.currency ?? "INR",
        billing_cycle: s.billing_cycle ?? "monthly",
        category: s.category ?? "other",
        next_billing_date: s.next_billing_date ?? null,
        status: s.status ?? "active",
        description: s.description ?? ""
      }));
      setSubscriptions(cleaned.length ? cleaned : getSampleSubscriptions());
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
      setSubscriptions(getSampleSubscriptions());
    } finally { setLoading(false); }
  };

  const resetNewSubscription = () => setNewSubscription({
    name: "", amount: "", currency: "INR", billing_cycle: "monthly",
    category: "entertainment", next_billing_date: "", status: "active", description: ""
  });

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    const payload = { ...newSubscription, amount: safeNumber(newSubscription.amount) };
    try {
      await axios.post(`${VITE_BASE_URL}/api/subscriptions`, payload, axiosConfig);
      toast.success("✨ Subscription added!");
      await fetchSubscriptions();
      setShowAddModal(false);
      resetNewSubscription();
    } catch (err) {
      console.error("Add subscription error:", err);
      setSubscriptions(prev => [...prev, { id: Date.now(), ...payload }]);
      setShowAddModal(false);
      resetNewSubscription();
    }
  };

  const handleUpdateStatus = async (subscriptionId, newStatus) => {
    try {
      await axios.put(`${VITE_BASE_URL}/api/subscriptions/${subscriptionId}`, { status: newStatus }, axiosConfig);
      setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? { ...s, status: newStatus } : s));
      toast.success(`Subscription ${newStatus}!`);
      fetchSubscriptions();
    } catch (err) {
      console.error("Update subscription error:", err);
      setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? { ...s, status: newStatus } : s));
    }
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    try {
      await axios.delete(`${VITE_BASE_URL}/api/subscriptions/${subscriptionId}`, axiosConfig);
      setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId));
      toast.success("Subscription deleted!");
    } catch (err) {
      console.error("Delete subscription error:", err);
      setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId));
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
    const upcomingRenewals = subscriptions.filter((sub) => {
      if (sub.status !== "active" || !sub.next_billing_date) return false;
      const nextBilling = new Date(sub.next_billing_date);
      if (Number.isNaN(nextBilling.getTime())) return false;
      const diffDays = Math.ceil((nextBilling - new Date()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    }).length;

    return { totalMonthly: Math.round(totalMonthly), totalYearly: Math.round(totalYearly), activeSubs, upcomingRenewals };
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
    return statusOptions.find(s => s.value === status) || statusOptions[statusOptions.length - 1];
  };

  const getDaysUntilBilling = (billingDate) => {
    if (!billingDate) return Infinity;
    const billing = new Date(billingDate);
    if (Number.isNaN(billing.getTime())) return Infinity;
    return Math.ceil((billing - new Date()) / (1000 * 60 * 60 * 24));
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
      title: "Monthly Cost", value: stats.totalMonthly, 
      color: "from-emerald-400 to-teal-300", icon: DollarSign, 
      subtitle: "Active subscriptions", isAmount: true,
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    { 
      title: "Yearly Cost", value: stats.totalYearly, 
      color: "from-blue-400 to-indigo-300", icon: TrendingUp, 
      subtitle: "Annual total", isAmount: true,
      bg: "from-blue-500/10 to-indigo-500/5"
    },
    { 
      title: "Active", value: stats.activeSubs, 
      color: "from-cyan-400 to-teal-300", icon: Repeat, 
      subtitle: "Currently active", isAmount: false,
      bg: "from-cyan-500/10 to-teal-500/5"
    },
    { 
      title: "Upcoming Renewals", value: stats.upcomingRenewals, 
      color: stats.upcomingRenewals > 0 ? "from-yellow-400 to-orange-300" : "from-emerald-400 to-teal-300", 
      icon: Calendar, subtitle: "Next 7 days", isAmount: false,
      bg: stats.upcomingRenewals > 0 ? "from-yellow-500/10 to-orange-500/5" : "from-emerald-500/10 to-teal-500/5"
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#030712] via-[#07101f] to-[#050816] text-emerald-300">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-3"
        >
          <Repeat className="w-6 h-6" />
          <span className="text-slate-400">Loading subscriptions...</span>
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

      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden">
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
                  Subscription Manager
                </div>
                <h1 className="mt-6 text-5xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent">
                    Subscriptions
                  </span>
                  <br/>
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    & Recurring Payments
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-slate-400 leading-8">
                  Manage your recurring subscriptions.
                  Track billing cycles and never miss a payment.
                </p>
              </div>

              <div className="flex items-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddModal(true)}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-5 py-3 font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/60 transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Subscription
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ====== Summary Banner ====== */}
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
                  <Repeat className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Subscription Summary</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="text-emerald-400 font-medium">₹{stats.totalMonthly.toLocaleString('en-IN')}</span>/month · {stats.activeSubs} active subscriptions
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
                  Auto-tracking
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
                      {stat.isAmount ? `₹${stat.value.toLocaleString('en-IN')}` : stat.value}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 shadow-lg`}>
                    <stat.icon className={`w-5 h-5 ${stat.color.includes("emerald") || stat.color.includes("teal") ? "text-emerald-400" : stat.color.includes("blue") ? "text-blue-400" : stat.color.includes("yellow") ? "text-yellow-400" : "text-cyan-400"}`} />
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
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <SlidersHorizontal className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="min-w-[140px] p-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                >
                  <option value="all" className="bg-[#0d141a]">All Status</option>
                  {statusOptions.map(s => (
                    <option key={s.value} value={s.value} className="bg-[#0d141a]">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {(filter !== "all" || searchQuery) && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setFilter("all"); setSearchQuery(""); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/5 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/30 transition-all flex items-center gap-2 flex-shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* ====== Subscriptions Table (Desktop) ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.03] text-slate-400 text-xs uppercase">
                    <th className="py-4 px-5 text-left font-medium rounded-tl-2xl">Service</th>
                    <th className="py-4 px-5 text-left font-medium">Amount</th>
                    <th className="py-4 px-5 text-left font-medium">Billing Cycle</th>
                    <th className="py-4 px-5 text-left font-medium">Category</th>
                    <th className="py-4 px-5 text-left font-medium">Next Billing</th>
                    <th className="py-4 px-5 text-left font-medium">Status</th>
                    <th className="py-4 px-5 text-left font-medium rounded-tr-2xl">Actions</th>
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
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-2.5 rounded-xl flex-shrink-0"
                              style={{ backgroundColor: categoryConfig.color + '20' }}
                            >
                              <CategoryIcon className="w-4 h-4" style={{ color: categoryConfig.color }} />
                            </div>
                            <div>
                              <div className="font-semibold text-white">{subscription.name}</div>
                              {subscription.description && (
                                <div className="text-xs text-slate-500 mt-0.5">{subscription.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-semibold text-emerald-400">
                            ₹{safeNumber(subscription.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="capitalize text-slate-300 flex items-center gap-1.5">
                            <Repeat className="w-3.5 h-3.5 text-slate-500" />
                            {subscription.billing_cycle}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5"
                            style={{ 
                              backgroundColor: categoryConfig.color + '20', 
                              color: categoryConfig.color 
                            }}
                          >
                            <CategoryIcon className="w-3 h-3" />
                            {categoryConfig.label}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {subscription.next_billing_date 
                              ? new Date(subscription.next_billing_date).toLocaleDateString() 
                              : "-"}
                          </div>
                          {Number.isFinite(daysUntilBilling) && daysUntilBilling >= 0 && (
                            <div className={`text-xs mt-1 ml-5 ${
                              daysUntilBilling <= 3 ? 'text-rose-400' : 
                              daysUntilBilling <= 7 ? 'text-yellow-400' : 
                              'text-slate-500'
                            }`}>
                              {daysUntilBilling === 0 ? 'Today!' : `${daysUntilBilling} days left`}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${statusConfig.bgColor} ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {subscription.status === "active" && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleUpdateStatus(subscription.id, "paused")}
                                  className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-lg hover:bg-yellow-500/20 transition-all flex items-center gap-1 border border-yellow-500/20"
                                >
                                  <Pause className="w-3 h-3" />
                                  Pause
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleUpdateStatus(subscription.id, "cancelled")}
                                  className="px-3 py-1.5 bg-rose-500/10 text-rose-400 text-xs rounded-lg hover:bg-rose-500/20 transition-all flex items-center gap-1 border border-rose-500/20"
                                >
                                  <Ban className="w-3 h-3" />
                                  Cancel
                                </motion.button>
                              </>
                            )}
                            {subscription.status === "paused" && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpdateStatus(subscription.id, "active")}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-1 border border-emerald-500/20"
                              >
                                <Play className="w-3 h-3" />
                                Resume
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteSubscription(subscription.id)}
                              className="px-3 py-1.5 bg-slate-500/10 text-slate-400 text-xs rounded-lg hover:bg-slate-500/20 transition-all flex items-center gap-1 border border-slate-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredSubscriptions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Repeat className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">
                    {subscriptions.length === 0 
                      ? "No subscriptions found. Add your first subscription!" 
                      : "No subscriptions match your filters."}
                  </p>
                </div>
              )}
            </div>

            {/* ====== Mobile Cards ====== */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredSubscriptions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Repeat className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No subscriptions found.</p>
                </div>
              )}
              {filteredSubscriptions.map((subscription) => {
                const categoryConfig = getCategoryConfig(subscription.category);
                const statusConfig = getStatusConfig(subscription.status);
                const CategoryIcon = categoryConfig.icon;
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="p-2.5 rounded-xl flex-shrink-0"
                          style={{ backgroundColor: categoryConfig.color + '20' }}
                        >
                          <CategoryIcon className="w-5 h-5" style={{ color: categoryConfig.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{subscription.name}</div>
                          <div className="text-xs text-slate-500">{subscription.description}</div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${statusConfig.bgColor} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/[0.03] rounded-xl p-2.5">
                        <p className="text-xs text-slate-500 mb-0.5">Amount</p>
                        <p className="font-semibold text-emerald-400">₹{safeNumber(subscription.amount).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-2.5">
                        <p className="text-xs text-slate-500 mb-0.5">Cycle</p>
                        <p className="font-semibold capitalize text-slate-300">{subscription.billing_cycle}</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-2.5">
                        <p className="text-xs text-slate-500 mb-0.5">Category</p>
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                          style={{ backgroundColor: categoryConfig.color + '20', color: categoryConfig.color }}
                        >
                          <CategoryIcon className="w-3 h-3" />
                          {categoryConfig.label}
                        </span>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-2.5">
                        <p className="text-xs text-slate-500 mb-0.5">Next Bill</p>
                        <p className="font-semibold text-slate-300 text-xs">
                          {subscription.next_billing_date 
                            ? new Date(subscription.next_billing_date).toLocaleDateString() 
                            : "-"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      {subscription.status === "active" && (
                        <>
                          <button onClick={() => handleUpdateStatus(subscription.id, "paused")} className="flex-1 px-2 py-2 bg-yellow-500/10 text-yellow-400 text-xs rounded-lg hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-1 border border-yellow-500/20">
                            <Pause className="w-3 h-3" /> Pause
                          </button>
                          <button onClick={() => handleUpdateStatus(subscription.id, "cancelled")} className="flex-1 px-2 py-2 bg-rose-500/10 text-rose-400 text-xs rounded-lg hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1 border border-rose-500/20">
                            <Ban className="w-3 h-3" /> Cancel
                          </button>
                        </>
                      )}
                      {subscription.status === "paused" && (
                        <button onClick={() => handleUpdateStatus(subscription.id, "active")} className="flex-1 px-2 py-2 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1 border border-emerald-500/20">
                          <Play className="w-3 h-3" /> Resume
                        </button>
                      )}
                      <button onClick={() => handleDeleteSubscription(subscription.id)} className="flex-1 px-2 py-2 bg-slate-500/10 text-slate-400 text-xs rounded-lg hover:bg-slate-500/20 transition-all flex items-center justify-center gap-1 border border-slate-500/20">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ====== Category Breakdown ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Subscription Categories</h3>
              <span className="ml-auto text-xs text-slate-500 bg-[#1a2228] px-3 py-1 rounded-full">
                {subscriptions.filter(s => s.status === "active").length} active
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categories.map(category => {
                const categorySubs = (subscriptions || []).filter(sub => sub.category === category.value && sub.status === "active");
                const categoryTotal = categorySubs.reduce((sum, sub) => sum + safeNumber(sub.amount), 0);
                const CategoryIcon = category.icon;
                
                return (
                  <motion.div
                    key={category.value}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={`relative overflow-hidden bg-gradient-to-br ${category.bg} border border-white/10 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:border-white/20 transition-all duration-300 group`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <CategoryIcon className="w-4 h-4" style={{ color: category.color }} />
                        </div>
                        <span className="text-sm font-semibold text-white">{category.label}</span>
                      </div>
                      <div className="text-2xl font-bold text-white mt-2">
                        ₹{categoryTotal.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                        {categorySubs.length} subscription{categorySubs.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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

        {/* ====== Add Subscription Modal ====== */}
        {showAddModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">Add New Subscription</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Track a new recurring payment</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubscription} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Service Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Netflix, Spotify, AWS"
                    value={newSubscription.name}
                    onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                    required
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newSubscription.amount}
                      onChange={(e) => setNewSubscription({ ...newSubscription, amount: e.target.value })}
                      required
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Billing Cycle</label>
                    <select
                      value={newSubscription.billing_cycle}
                      onChange={(e) => setNewSubscription({ ...newSubscription, billing_cycle: e.target.value })}
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                    >
                      {billingCycles.map((cycle) => (
                        <option key={cycle.value} value={cycle.value} className="bg-[#0d141a]">
                          {cycle.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Category</label>
                    <select
                      value={newSubscription.category}
                      onChange={(e) => setNewSubscription({ ...newSubscription, category: e.target.value })}
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value} className="bg-[#0d141a]">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block font-medium">Status</label>
                    <select
                      value={newSubscription.status}
                      onChange={(e) => setNewSubscription({ ...newSubscription, status: e.target.value })}
                      className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value} className="bg-[#0d141a]">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Next Billing Date</label>
                  <input
                    type="date"
                    value={newSubscription.next_billing_date}
                    onChange={(e) => setNewSubscription({ ...newSubscription, next_billing_date: e.target.value })}
                    required
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">
                    Description <span className="text-slate-600">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Add notes about this subscription..."
                    value={newSubscription.description}
                    onChange={(e) => setNewSubscription({ ...newSubscription, description: e.target.value })}
                    rows={3}
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowAddModal(false)}
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
                    Add Subscription
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

export default SubscriptionsPage;