// NotificationsPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  markAsRead,
  markAllRead,
  deleteNotification,
} from "../lib/notificationsApi.js";
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
  TrendingUp
} from "lucide-react";

const NotificationsPage = () => {
  const { user: authUser, token: authToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    billing_reminders: true,
    subscription_alerts: true,
    budget_alerts: true
  });

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

  const notificationTypes = {
    billing: { label: "Billing", color: "#f59e0b", icon: CreditCard, bgGradient: "from-yellow-500/10 to-orange-500/5" },
    budget: { label: "Budget", color: "#8b5cf6", icon: TrendingUp, bgGradient: "from-purple-500/10 to-violet-500/5" },
    security: { label: "Security", color: "#ef4444", icon: Shield, bgGradient: "from-rose-500/10 to-red-500/5" },
    report: { label: "Report", color: "#06b6d4", icon: Info, bgGradient: "from-cyan-500/10 to-blue-500/5" },
    system: { label: "System", color: "#6b7280", icon: Settings, bgGradient: "from-gray-500/10 to-slate-500/5" },
    subscription: { label: "Subscription", color: "#f97316", icon: Repeat, bgGradient: "from-orange-500/10 to-amber-500/5" }
  };

  const priorityLevels = {
    high: { label: "High", color: "text-rose-400", bgColor: "bg-rose-500/20", icon: AlertTriangle },
    medium: { label: "Medium", color: "text-yellow-400", bgColor: "bg-yellow-500/20", icon: AlertCircle },
    low: { label: "Low", color: "text-emerald-400", bgColor: "bg-emerald-500/20", icon: Info }
  };

  const token = localStorage.getItem("token");
  
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Generate sample notifications for demonstration
  const generateSampleNotifications = () => [
    {
      id: 1,
      title: "Subscription Renewal Alert",
      message: "Your Netflix subscription will renew in 3 days for ₹649",
      type: "subscription",
      priority: "medium",
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      action_url: "/subscriptions"
    },
    {
      id: 2,
      title: "Budget Alert",
      message: "You've used 85% of your Food & Dining budget this month",
      type: "budget",
      priority: "high",
      is_read: false,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      action_url: "/budgets"
    },
    {
      id: 3,
      title: "Monthly Report Ready",
      message: "Your February 2026 financial report is now available",
      type: "report",
      priority: "low",
      is_read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      action_url: "/reports"
    }
  ];

  useEffect(() => {
    console.log('Token:', token);
    if (token) {
      fetchUser();
      fetchNotifications();
      fetchNotificationSettings();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen || showSettings ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showSettings]);

  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      setUser(res.data.user);
    } catch (err) {
      console.error("Fetch user error:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      console.log('Fetching notifications...');
      const res = await axios.get(`${VITE_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });
      console.log('Notifications response:', res.data);
      
      const backendNotifications = res.data.notifications || res.data;
      const notifArray = Array.isArray(backendNotifications) ? backendNotifications : [];
      
      setNotifications(notifArray.length > 0 ? notifArray : generateSampleNotifications());
    } catch (err) {
      console.error("Fetch notifications error:", err.response?.data || err.message);
      setNotifications(generateSampleNotifications());
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/notifications/settings`, axiosConfig);
      setNotificationSettings(res.data.settings || notificationSettings);
    } catch (err) {
      console.error("Fetch notification settings error:", err);
    }
  };

  const updateNotificationSettings = async (newSettings) => {
    try {
      await axios.put(`${VITE_BASE_URL}/api/notifications/settings`, newSettings, axiosConfig);
      setNotificationSettings(newSettings);
      setShowSettings(false);
      toast.success("Settings saved!");
    } catch (err) {
      console.error("Update notification settings error:", err);
      setNotificationSettings(newSettings);
      setShowSettings(false);
    }
  };

  const markAsReadHandler = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error("Mark as read error:", err);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    }
  };

  const markAllAsReadHandler = async () => {
    try {
      await markAllRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (err) {
      console.error("Mark all as read error:", err);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    }
  };

  const deleteNotificationHandler = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (err) {
      console.error("Delete notification error:", err);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete(`${VITE_BASE_URL}/api/notifications`, axiosConfig);
      setNotifications([]);
    } catch (err) {
      console.error("Clear all notifications error:", err);
      setNotifications([]);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.is_read;
    return notification.type === filter;
  });

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
      title: "Total Notifications", value: notificationStats.total, 
      color: "from-emerald-400 to-teal-300", icon: Bell, 
      subtitle: "All time",
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    { 
      title: "Unread", value: notificationStats.unread, 
      color: "from-rose-400 to-red-300", icon: BellRing, 
      subtitle: notificationStats.unread > 0 ? "Needs attention" : "All caught up",
      bg: "from-rose-500/10 to-red-500/5"
    },
    { 
      title: "High Priority", value: notificationStats.highPriority, 
      color: "from-yellow-400 to-orange-300", icon: AlertTriangle, 
      subtitle: notificationStats.highPriority > 0 ? "Urgent action needed" : "No urgent alerts",
      bg: "from-yellow-500/10 to-orange-500/5"
    },
    { 
      title: "Today", value: notificationStats.today, 
      color: "from-cyan-400 to-blue-300", icon: Clock, 
      subtitle: "Received today",
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
        user={user || authUser || { username: "Guest" }}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-8 mt-16 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">

          {/* Glow orbs */}
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[180px]" />
          <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[180px]" />

          {/* ====== Page Header ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-emerald-500/[0.03] backdrop-blur-2xl p-4 md:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Notification Center</h1>
                <p className="text-xs text-slate-400">Stay updated with your financial activities.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2 font-semibold text-xs text-slate-300 hover:text-white hover:border-emerald-500/30 transition-all flex items-center gap-2"
              >
                <Settings size={14} />
                Settings
              </button>
              <button
                onClick={markAllAsReadHandler}
                disabled={notificationStats.unread === 0}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-3.5 py-2 font-semibold text-xs text-white shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle size={14} />
                Mark All Read
              </button>
            </div>
          </motion.div>

          {/* ====== Notification Summary Banner ====== */}
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
                  <Bell className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Notification Summary</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    You have <span className="text-emerald-400 font-medium">{notificationStats.unread}</span> unread notifications. 
                    {notificationStats.highPriority > 0 && (
                      <span className="text-rose-400"> {notificationStats.highPriority} require immediate attention.</span>
                    )}
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
                      {stat.value}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 shadow-lg`}>
                    <stat.icon className={`w-5 h-5 ${stat.color.includes("emerald") ? "text-emerald-400" : stat.color.includes("rose") ? "text-rose-400" : stat.color.includes("yellow") ? "text-yellow-400" : "text-cyan-400"}`} />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 mr-2 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  Filter:
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filter === "all" 
                      ? "bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 text-white shadow-xl shadow-emerald-500/30" 
                      : "bg-white/5 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/30"
                  }`}
                >
                  All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter("unread")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    filter === "unread" 
                      ? "bg-gradient-to-r from-rose-500 to-red-400 text-white shadow-xl shadow-rose-500/30" 
                      : "bg-white/5 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white hover:border-rose-500/30"
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  Unread
                </motion.button>
                {Object.entries(notificationTypes).map(([key, type]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilter(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      filter === key 
                        ? `bg-gradient-to-r ${type.bgGradient.replace('/10', '/20').replace('/5', '/10')} border` 
                        : "bg-white/5 backdrop-blur-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                    style={filter === key ? { borderColor: type.color + '40' } : {}}
                  >
                    <type.icon className="w-3.5 h-3.5" style={{ color: filter === key ? type.color : undefined }} />
                    {type.label}
                  </motion.button>
                ))}
              </div>
              
              {notifications.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={clearAllNotifications}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all border border-rose-500/20 flex items-center gap-2 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* ====== Notifications List ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Inbox className="w-5 h-5 text-emerald-400" />
                {filter === "all" ? "All Notifications" : 
                 filter === "unread" ? "Unread Notifications" : 
                 `${notificationTypes[filter]?.label} Notifications`}
                <span className="text-slate-500 text-sm font-normal ml-2">
                  ({filteredNotifications.length})
                </span>
              </h3>
            </div>
            
            <div className="divide-y divide-white/5 max-h-[50rem] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => {
                  const typeConfig = notificationTypes[notification.type] || notificationTypes.system;
                  const priorityConfig = priorityLevels[notification.priority] || priorityLevels.low;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-5 transition-all group ${
                        !notification.is_read 
                          ? 'bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-l-4 border-l-emerald-500' 
                          : 'bg-transparent'
                      } hover:bg-white/[0.03]`}
                      whileHover={{ x: 2 }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Type Icon */}
                          <div 
                            className="p-3 rounded-xl flex-shrink-0 shadow-lg"
                            style={{ backgroundColor: typeConfig.color + '20' }}
                          >
                            <typeConfig.icon className="w-5 h-5" style={{ color: typeConfig.color }} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h4 className={`font-semibold text-sm ${!notification.is_read ? 'text-white' : 'text-slate-300'}`}>
                                {notification.title}
                              </h4>
                              <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium flex items-center gap-1 ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                                <priorityConfig.icon className="w-3 h-3" />
                                {priorityConfig.label}
                              </span>
                              {!notification.is_read && (
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-slate-400 text-sm mb-2.5 leading-relaxed">{notification.message}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {getTimeAgo(notification.created_at)}
                              </span>
                              {notification.action_url && (
                                <a 
                                  href={notification.action_url}
                                  className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 font-medium"
                                >
                                  View Details
                                  <ArrowRight className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!notification.is_read && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => markAsReadHandler(notification.id)}
                              className="p-2.5 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all"
                              title="Mark as read"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteNotificationHandler(notification.id)}
                            className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 mb-6">
                    <BellOff className="w-16 h-16 text-emerald-400 opacity-30" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No notifications</h3>
                  <p className="text-slate-400 max-w-md text-center">
                    You're all caught up! New alerts will appear here when there's something important.
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
      </div>

      {/* ====== Notification Settings Modal ====== */}
        {showSettings && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] "
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
                  <Settings className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">Notification Settings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Customize how you receive alerts</p>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
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
                        className="flex items-center justify-between p-4 bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10">
                            <SettingIcon className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm capitalize">
                            {key.replace(/_/g, ' ').replace(/^./, str => str.toUpperCase())}
                          </div>
                            <div className="text-xs text-slate-500 mt-0.5">
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
                          <div className="w-12 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:via-green-500 peer-checked:to-lime-400 shadow-inner"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSettings(false)}
                    className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 hover:text-white hover:border-slate-400/30 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateNotificationSettings(notificationSettings)}
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-5 py-3 font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/60 transition-all"
                  >
                    Save Settings
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
    </div>
  );
};

// Helper function for setting descriptions
function getSettingDescription(key) {
  const descriptions = {
    email_notifications: "Receive notifications via email",
    push_notifications: "Receive push notifications in browser",
    billing_reminders: "Get reminders for upcoming bill payments",
    budget_alerts: "Receive alerts when you exceed budget limits",
    subscription_alerts: "Get alerts about subscription renewals"
  };
  return descriptions[key] || "Notification setting";
}

export default NotificationsPage;