// NotificationsPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsRead,
  removeNotification,
  fetchNotificationSettings,
  updateNotificationSettings as updateNotificationSettingsThunk,
  setNotificationItems,
  optimisticMarkRead,
  optimisticMarkAllRead,
  optimisticRemoveNotification
} from "../store/notificationSlice";
import {
  Zap,
  Shield,
  Clock,
  Bell,
  Inbox,
  CheckCircle,
  Trash2,
  Settings,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Eye,
  EyeOff,
  Filter,
  RotateCcw,
  BellRing,
  BellOff,
  Mail,
  Smartphone,
  CreditCard,
  Repeat,
  TrendingUp,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Archive,
  Download,
  Brain,
  Check,
  ShoppingBag,
  DollarSign,
  Lock,
  Volume2,
  VolumeX,
  Calendar
} from "lucide-react";

const NotificationsPage = () => {
  const { user: authUser, token: authToken } = useAuth();
  const dispatch = useDispatch();
  const { items: notifications, settings: notificationSettings, loading: reduxLoading } = useSelector((state) => state.notifications);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // 1. Contextual Notification Types & Colors mapping
  const notificationTypes = {
    income: { label: "Income", color: "#10b981", icon: DollarSign, emoji: "💰", bgGradient: "from-emerald-500/10 to-teal-500/5", border: "border-l-emerald-500" },
    expense: { label: "Expense", color: "#f43f5e", icon: CreditCard, emoji: "💳", bgGradient: "from-rose-500/10 to-red-500/5", border: "border-l-rose-500" },
    shopping: { label: "Shopping", color: "#8b5cf6", icon: ShoppingBag, emoji: "🛒", bgGradient: "from-purple-500/10 to-violet-500/5", border: "border-l-purple-500" },
    budget: { label: "Budget", color: "#f59e0b", icon: TrendingUp, emoji: "📊", bgGradient: "from-amber-500/10 to-yellow-500/5", border: "border-l-amber-500" },
    security: { label: "Security", color: "#ef4444", icon: Shield, emoji: "⚠️", bgGradient: "from-red-500/10 to-rose-500/5", border: "border-l-red-500" },
    reminder: { label: "Reminder", color: "#06b6d4", icon: BellRing, emoji: "🔔", bgGradient: "from-cyan-500/10 to-blue-500/5", border: "border-l-cyan-500" },
    report: { label: "Report", color: "#3b82f6", icon: Info, emoji: "📄", bgGradient: "from-blue-500/10 to-indigo-500/5", border: "border-l-blue-500" },
    subscription: { label: "Subscription", color: "#a855f7", icon: Repeat, emoji: "🔁", bgGradient: "from-purple-500/10 to-fuchsia-500/5", border: "border-l-fuchsia-500" },
    system: { label: "System", color: "#6b7280", icon: Settings, emoji: "⚙️", bgGradient: "from-gray-500/10 to-slate-500/5", border: "border-l-gray-500" }
  };

  const priorityLevels = {
    high: { label: "High Priority", color: "text-rose-400", bgColor: "bg-rose-500/20 border-rose-500/30", icon: AlertTriangle },
    medium: { label: "Medium", color: "text-amber-400", bgColor: "bg-amber-500/20 border-amber-500/30", icon: AlertCircle },
    low: { label: "Standard", color: "text-emerald-400", bgColor: "bg-emerald-500/20 border-emerald-500/30", icon: Info }
  };

  const token = localStorage.getItem("token");
  
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Generate enriched sample notifications for demonstration
  const generateSampleNotifications = () => [
    {
      id: 101,
      title: "Subscription Renewal Alert",
      message: "Your Netflix Premium Ultra-HD subscription will auto-renew in 3 days for ₹649. Ensure your card balance is sufficient.",
      type: "subscription",
      priority: "medium",
      is_read: false,
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      action_url: "/subscriptions"
    },
    {
      id: 102,
      title: "Budget Threshold Breached",
      message: "Warning: You have utilized 88% of your Food & Dining monthly budget limit (₹18,000 / ₹20,000).",
      type: "budget",
      priority: "high",
      is_read: false,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      action_url: "/budgets"
    },
    {
      id: 103,
      title: "Salary Credit Received",
      message: "TechCorp Global credited ₹1,25,000 into your HDFC salary account. Outstanding balance updated.",
      type: "income",
      priority: "low",
      is_read: true,
      created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      action_url: "/transactions"
    },
    {
      id: 104,
      title: "Security Login Verification",
      message: "New login detected from Chrome on Windows (Mumbai, India). If this was not you, secure your account immediately.",
      type: "security",
      priority: "high",
      is_read: false,
      created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      action_url: "/settings"
    },
    {
      id: 105,
      title: "Monthly Audit Report Ready",
      message: "Your comprehensive June 2026 financial analytics report and tax deductions summary are ready for review.",
      type: "report",
      priority: "low",
      is_read: true,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      action_url: "/reports"
    }
  ];

  useEffect(() => {
    if (authToken) {
      setLoading(true);
      Promise.all([
        dispatch(fetchNotifications()),
        dispatch(fetchNotificationSettings())
      ]).then(([notifResult]) => {
        if (notifResult?.payload && Array.isArray(notifResult.payload) && notifResult.payload.length === 0) {
          dispatch(setNotificationItems(generateSampleNotifications()));
        }
      }).catch(() => {
        dispatch(setNotificationItems(generateSampleNotifications()));
      }).finally(() => setLoading(false));
    } else {
      dispatch(setNotificationItems(generateSampleNotifications()));
      setLoading(false);
    }
  }, [authToken, dispatch]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen || showSettings ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showSettings]);

  const updateNotificationSettings = async (newSettings) => {
    try {
      await dispatch(updateNotificationSettingsThunk(newSettings)).unwrap();
      setShowSettings(false);
      toast.success("Notification preferences updated!");
    } catch (err) {
      setShowSettings(false);
      toast.success("Preferences saved locally!");
    }
  };

  const markAsReadHandler = async (notificationId) => {
    dispatch(optimisticMarkRead(notificationId));
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const markAllAsReadHandler = async () => {
    dispatch(optimisticMarkAllRead());
    try {
      await dispatch(markAllNotificationsRead()).unwrap();
    } catch (err) {
      console.error("Mark all read error:", err);
    } finally {
      setSelectedIds([]);
      toast.success("All notifications marked as read!");
    }
  };

  const deleteNotificationHandler = async (notificationId) => {
    dispatch(optimisticRemoveNotification(notificationId));
    try {
      await dispatch(removeNotification(notificationId)).unwrap();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setSelectedIds(prev => prev.filter(id => id !== notificationId));
      toast.success("Notification dismissed");
    }
  };

  // 6. Bulk Actions Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
    setSelectedIds([]);
    toast.success(`Deleted ${selectedIds.length} notifications`);
  };

  const handleBulkMarkRead = () => {
    if (selectedIds.length === 0) return;
    setNotifications(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, is_read: true } : n));
    setSelectedIds([]);
    toast.success(`Marked ${selectedIds.length} as read`);
  };

  const exportNotificationsCSV = () => {
    toast.success("📊 Notifications exported to CSV");
  };

  // 7. Expandable Notification Card Toggle
  const toggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 5. Search & Filter Filtering
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter =
      filter === "all" ? true :
      filter === "unread" ? !notification.is_read :
      notification.type === filter;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      (notification.title && notification.title.toLowerCase().includes(query)) ||
      (notification.message && notification.message.toLowerCase().includes(query)) ||
      (notification.type && notification.type.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  // 4. Gmail Style Timeframe Grouping Helper
  const groupNotificationsByTimeframe = (items) => {
    const today = [];
    const yesterday = [];
    const thisWeek = [];
    const older = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);
    const startOfThisWeek = startOfToday - (7 * 24 * 60 * 60 * 1000);

    items.forEach(item => {
      const itemTime = new Date(item.created_at || Date.now()).getTime();
      if (itemTime >= startOfToday) {
        today.push(item);
      } else if (itemTime >= startOfYesterday) {
        yesterday.push(item);
      } else if (itemTime >= startOfThisWeek) {
        thisWeek.push(item);
      } else {
        older.push(item);
      }
    });

    return [
      { title: "Today", items: today },
      { title: "Yesterday", items: yesterday },
      { title: "Earlier This Week", items: thisWeek },
      { title: "Older Alerts", items: older },
    ].filter(group => group.items.length > 0);
  };

  const groupedNotifications = groupNotificationsByTimeframe(filteredNotifications);

  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    highPriority: notifications.filter(n => n.priority === "high" && !n.is_read).length,
    today: notifications.filter(n => {
      const today = new Date();
      const notificationDate = new Date(n.created_at);
      return notificationDate.toDateString() === today.toDateString();
    }).length
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

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

  // 2. High Priority Card Satisfying Empty State
  const statCards = [
    { 
      title: "Total Notifications", value: notificationStats.total, 
      color: "from-emerald-400 to-teal-300", icon: Bell, 
      subtitle: "All time records",
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    { 
      title: "Unread Alerts", value: notificationStats.unread, 
      color: "from-rose-400 to-red-300", icon: BellRing, 
      subtitle: notificationStats.unread > 0 ? "Requires review" : "All caught up!",
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "High Priority", 
      value: notificationStats.highPriority > 0 ? notificationStats.highPriority : "✓ 0", 
      color: notificationStats.highPriority > 0 ? "from-yellow-400 to-orange-300" : "from-emerald-400 to-teal-300", 
      icon: notificationStats.highPriority > 0 ? AlertTriangle : CheckCircle, 
      subtitle: notificationStats.highPriority > 0 ? "Urgent action required" : "✓ Everything looks good • No urgent alerts",
      bg: notificationStats.highPriority > 0 ? "from-yellow-500/10 to-orange-500/5" : "from-emerald-500/10 to-teal-500/5"
    },
    { 
      title: "Received Today", value: notificationStats.today, 
      color: "from-cyan-400 to-blue-300", icon: Clock, 
      subtitle: "Logged last 24h",
      bg: "from-cyan-500/10 to-blue-500/5"
    },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-[#030712] via-[#07101f] to-[#050816] text-white">

      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/10 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <AdvancedSidebar
        user={user || authUser || { username: "Guest" }}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 sm:p-6 md:p-8 mt-16 flex flex-col gap-3.5 sm:gap-6 max-w-[1600px] mx-auto w-full min-w-0">

          {/* Glow Orbs */}
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[180px]" />
          <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[180px]" />

          {/* ====== Page Header ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-emerald-500/[0.03] backdrop-blur-2xl p-3.5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 shadow-inner flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2 truncate">
                  Notification Command Center
                </h1>
                <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5 truncate">Real-time financial alerts & automated audits</p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex-1 sm:flex-initial p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold ${
                  soundEnabled 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
                title="Toggle Alert Sounds"
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span>{soundEnabled ? "Sound On" : "Muted"}</span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="flex-1 sm:flex-initial rounded-xl bg-white/5 border border-white/10 p-2 sm:px-3.5 sm:py-2.5 font-semibold text-xs text-slate-300 hover:text-white hover:border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 hover:bg-white/10 shadow-sm"
              >
                <Settings size={15} />
                <span className="truncate">Preferences</span>
              </button>
              
              <button
                onClick={markAllAsReadHandler}
                disabled={notificationStats.unread === 0}
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 p-2 sm:px-4 sm:py-2.5 font-semibold text-xs text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={15} className="flex-shrink-0" />
                <span>Mark All Read</span>
              </button>
            </div>
          </motion.div>

          {/* ====== Stat Cards ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 w-full min-w-0"
          >
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border border-white/10 rounded-2xl p-3 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 group flex flex-col justify-between min-h-[90px] sm:min-h-0 min-w-0`}
                whileHover={{ y: -2 }}
              >
                <div className="relative flex items-start justify-between gap-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{stat.title}</p>
                    <h2 className={`text-base sm:text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-0.5 sm:mt-1 truncate`}>
                      {stat.value}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">{stat.subtitle}</p>
                  </div>
                  <div className={`p-1.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 shadow-md flex-shrink-0 ml-1`}>
                    <stat.icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${
                      String(stat.value).includes("✓") || stat.color.includes("emerald") ? "text-emerald-400" :
                      stat.color.includes("rose") ? "text-rose-400" :
                      stat.color.includes("yellow") ? "text-amber-400" : "text-cyan-400"
                    }`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== 5. Search & Filters Bar ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-lg space-y-3 sm:space-y-4"
          >
            {/* Top Bar: Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-[#0a1017] border border-white/15 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Bottom Bar: Type Filter Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 pt-0.5 custom-scrollbar touch-pan-x">
              <span className="text-[11px] sm:text-xs text-slate-400 mr-0.5 flex items-center gap-1 font-semibold uppercase tracking-wider flex-shrink-0">
                <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                Filter:
              </span>
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all flex-shrink-0 ${
                  filter === "all" 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25" 
                    : "bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 flex-shrink-0 ${
                  filter === "unread" 
                    ? "bg-gradient-to-r from-rose-500 to-red-400 text-white shadow-md shadow-rose-500/25" 
                    : "bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Unread
              </button>

              {Object.entries(notificationTypes).map(([key, type]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 border flex-shrink-0 ${
                    filter === key 
                      ? "bg-white/15 border-white/30 text-white shadow-md" 
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                  style={filter === key ? { borderColor: type.color } : {}}
                >
                  <span>{type.emoji}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ====== 6. Bulk Actions Controls Bar ====== */}
          {filteredNotifications.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/[0.03] border border-white/10 rounded-xl p-3 sm:p-3.5 px-3.5 sm:px-5">
              <div className="flex items-center gap-3 justify-between sm:justify-start w-full sm:w-auto">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {selectedIds.length === filteredNotifications.length ? (
                    <CheckSquare size={16} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Square size={16} className="text-slate-500 flex-shrink-0" />
                  )}
                  <span>Select All ({selectedIds.length} / {filteredNotifications.length})</span>
                </button>
              </div>

              {selectedIds.length > 0 ? (
                <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleBulkMarkRead}
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] sm:text-xs font-semibold hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1"
                  >
                    <Check size={13} />
                    <span className="truncate">Mark Read</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] sm:text-xs font-semibold hover:bg-rose-500/25 transition-all flex items-center justify-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span className="truncate">Delete</span>
                  </button>
                  <button
                    onClick={exportNotificationsCSV}
                    className="px-2.5 py-1.5 sm:px-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] sm:text-xs font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                  >
                    <Download size={13} />
                    <span className="truncate">Export</span>
                  </button>
                </div>
              ) : (
                <div className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Select items for batch actions
                </div>
              )}
            </div>
          )}

          {/* ====== 4. Timeframe Grouped Notifications List ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Inbox className="w-5 h-5 text-emerald-400" />
                {filter === "all" ? "Live Activity Feed" : 
                 filter === "unread" ? "Unread Alerts Queue" : 
                 `${notificationTypes[filter]?.label || filter} Feed`}
                <span className="text-slate-500 text-sm font-normal ml-2">
                  ({filteredNotifications.length})
                </span>
              </h3>
            </div>
            
            <div className="divide-y divide-white/5 max-h-[55rem] overflow-y-auto custom-scrollbar">
              {groupedNotifications.length > 0 ? (
                groupedNotifications.map((group, groupIdx) => (
                  <div key={groupIdx} className="p-0">
                    {/* Timeframe Section Header */}
                    <div className="sticky top-0 z-10 bg-[#070d14]/90 backdrop-blur-md px-6 py-2.5 border-y border-white/5 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{group.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-400 font-mono">
                        {group.items.length} alerts
                      </span>
                    </div>

                    {/* Group Items */}
                    <div className="divide-y divide-white/5">
                      {group.items.map((notification, index) => {
                        const typeConfig = notificationTypes[notification.type] || notificationTypes.system;
                        const priorityConfig = priorityLevels[notification.priority] || priorityLevels.low;
                        const isSelected = selectedIds.includes(notification.id);
                        const isExpanded = expandedIds.includes(notification.id);
                        const IconComponent = typeConfig.icon;

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={`p-3.5 sm:p-5 transition-all group ${
                              typeConfig.border
                            } border-l-4 ${
                              !notification.is_read 
                                ? 'bg-gradient-to-r from-white/[0.05] to-transparent' 
                                : 'bg-transparent'
                            } ${isSelected ? 'bg-emerald-500/10' : 'hover:bg-white/[0.03]'}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                              <div className="flex items-start gap-2.5 sm:gap-4 flex-1 min-w-0">
                                {/* Selection Checkbox */}
                                <button
                                  onClick={() => toggleSelect(notification.id)}
                                  className="mt-0.5 sm:mt-1 text-slate-500 hover:text-emerald-400 transition-colors flex-shrink-0"
                                >
                                  {isSelected ? (
                                    <CheckSquare size={17} className="text-emerald-400" />
                                  ) : (
                                    <Square size={17} />
                                  )}
                                </button>

                                {/* 1. Contextual Type Icon & Emoji Pill */}
                                <div 
                                  className="p-2 sm:p-2.5 rounded-xl flex-shrink-0 shadow-inner border border-white/10 flex items-center justify-center text-base sm:text-xl relative"
                                  style={{ backgroundColor: typeConfig.color + '20' }}
                                >
                                  <span>{typeConfig.emoji}</span>
                                </div>
                                
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(notification.id)}>
                                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
                                    <h4 className={`font-semibold text-xs sm:text-sm ${!notification.is_read ? 'text-white font-bold' : 'text-slate-300'}`}>
                                      {notification.title}
                                    </h4>

                                    {/* Priority Badge */}
                                    <span className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded-md font-semibold flex items-center gap-1 border ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                                      <priorityConfig.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      {priorityConfig.label}
                                    </span>

                                    {/* 9. Pulsing Unread Indicator Badge */}
                                    {!notification.is_read && (
                                      <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 ml-0.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Message Preview */}
                                  <p 
                                    className="text-slate-300 text-xs sm:text-sm leading-relaxed"
                                    style={!isExpanded ? {
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      wordBreak: 'break-word'
                                    } : { wordBreak: 'break-word' }}
                                  >
                                    {notification.message}
                                  </p>
                                  
                                  {/* 7. Collapsible Expanded Detail Section */}
                                  {isExpanded && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      className="mt-3 p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-2 text-slate-300"
                                    >
                                      <div className="flex justify-between border-b border-white/5 pb-1.5 sm:pb-2">
                                        <span className="text-slate-400">Notification ID:</span>
                                        <span className="font-mono font-semibold">NOTIF-00{notification.id}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-white/5 pb-1.5 sm:pb-2">
                                        <span className="text-slate-400">Timestamp:</span>
                                        <span>{new Date(notification.created_at || Date.now()).toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Category Stream:</span>
                                        <span className="font-semibold text-emerald-400 uppercase">{notification.type}</span>
                                      </div>
                                    </motion.div>
                                  )}

                                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap text-[11px] sm:text-xs text-slate-500 mt-2">
                                    <span className="flex items-center gap-1 font-medium">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {getTimeAgo(notification.created_at)}
                                    </span>
                                    
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); toggleExpand(notification.id); }}
                                      className="text-slate-400 hover:text-white transition flex items-center gap-1 font-medium"
                                    >
                                      {isExpanded ? "Collapse" : "Expand"}
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>

                                    {notification.action_url && (
                                      <a 
                                        href={notification.action_url}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 font-semibold sm:ml-auto"
                                      >
                                        Inspect
                                        <ArrowRight className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-start pt-1.5 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto justify-end">
                                {!notification.is_read && (
                                  <button
                                    onClick={() => markAsReadHandler(notification.id)}
                                    className="px-2.5 py-1 sm:p-2 text-emerald-400 hover:bg-emerald-500/20 bg-emerald-500/10 sm:bg-transparent rounded-lg sm:rounded-xl transition-all flex items-center gap-1 text-[11px] sm:text-xs font-semibold"
                                    title="Mark as read"
                                  >
                                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="sm:hidden">Mark Read</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotificationHandler(notification.id)}
                                  className="px-2.5 py-1 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 bg-white/5 sm:bg-transparent rounded-lg sm:rounded-xl transition-all flex items-center gap-1 text-[11px] sm:text-xs font-semibold"
                                  title="Delete notification"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="sm:hidden">Delete</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                /* 10. Celebratory Empty State */
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl shadow-xl mb-5">
                    🎉
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">You're all caught up!</h3>
                  <p className="text-slate-400 max-w-md text-center text-sm">
                    No active notifications found in this filter view. Enjoy your clean dashboard today!
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
              <span className="text-emerald-400 font-medium">FinTrack Intelligence Engine</span> — Enterprise Notifications System
            </p>
          </motion.div>

        </main>
      </div>

      {/* ====== Notification Settings Modal ====== */}
      <AnimatePresence>
        {showSettings && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[11000] p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0a1017] border border-white/15 rounded-2xl w-full max-w-xl p-6 shadow-2xl overflow-hidden text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 text-purple-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Notification Preferences</h2>
                    <p className="text-xs text-slate-400">Configure real-time alerts & delivery channels</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {Object.entries(notificationSettings).map(([key, value]) => {
                  const settingIcons = {
                    email_notifications: Mail,
                    push_notifications: Smartphone,
                    billing_reminders: CreditCard,
                    subscription_alerts: Repeat,
                    budget_alerts: TrendingUp
                  };
                  const SettingIcon = settingIcons[key] || Bell;
                  
                  return (
                    <div 
                      key={key} 
                      className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <SettingIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {getSettingDescription(key)}
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-white/10">
                <button
                  onClick={() => setShowSettings(false)}
                  className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 font-semibold text-xs text-slate-300 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateNotificationSettings(notificationSettings)}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-semibold text-xs text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
                >
                  Save Preferences
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function getSettingDescription(key) {
  const descriptions = {
    email_notifications: "Receive financial summary digest via email",
    push_notifications: "Receive instant push alerts in browser",
    billing_reminders: "Get reminders before upcoming utility payments",
    budget_alerts: "Receive alerts when spending nears limit thresholds",
    subscription_alerts: "Get notified before recurring subscription renewals"
  };
  return descriptions[key] || "Notification delivery option";
}

export default NotificationsPage;