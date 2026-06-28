// NotificationsPage.jsx - FinTrack Theme
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import {
  markAsRead,
  markAllRead,
  deleteNotification,
} from "../lib/notificationsApi.js";
import { FiZap, FiShield, FiClock, FiBell, FiInbox, FiCheckCircle, FiTrash2, FiSettings } from "react-icons/fi";

const NotificationsPage = () => {
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
    billing: { label: "💳 Billing", color: "text-emerald-400", bgColor: "bg-emerald-500/20", borderColor: "border-emerald-500/20" },
    budget: { label: "📊 Budget", color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/20" },
    security: { label: "🔒 Security", color: "text-rose-400", bgColor: "bg-rose-500/20", borderColor: "border-rose-500/20" },
    report: { label: "📈 Report", color: "text-teal-400", bgColor: "bg-teal-500/20", borderColor: "border-teal-500/20" },
    system: { label: "⚙️ System", color: "text-gray-400", bgColor: "bg-gray-500/20", borderColor: "border-gray-500/20" },
    subscription: { label: "🔄 Subscription", color: "text-orange-400", bgColor: "bg-orange-500/20", borderColor: "border-orange-500/20" }
  };

  const priorityLevels = {
    high: { label: "High", color: "text-rose-400", bgColor: "bg-rose-500/20" },
    medium: { label: "Medium", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
    low: { label: "Low", color: "text-emerald-400", bgColor: "bg-emerald-500/20" }
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
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
  }, [mobileSidebarOpen]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
        <AdvancedSidebar
          user={user}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-3 text-emerald-400"
          >
            <FiBell className="w-6 h-6" />
            <span>Loading notifications...</span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0"
          >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Notifications</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  <FiZap className="w-3 h-3" />
                  AI Insights Active
                </span>
              </div>
              <p className="text-gray-400 text-sm">Stay updated with your financial activities</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-all duration-200 text-sm flex items-center gap-2"
              >
                <FiSettings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={markAllAsReadHandler}
                disabled={notificationStats.unread === 0}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <FiCheckCircle className="w-4 h-4" />
                Mark All Read
              </button>
            </div>
          </motion.div>

          {/* AI Insight Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <FiBell className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Notification Summary</p>
                <p className="text-xs text-gray-400">
                  You have {notificationStats.unread} unread notifications. {notificationStats.highPriority > 0 && `${notificationStats.highPriority} require immediate attention.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FiShield className="w-3 h-3 text-emerald-400" />
                Secure
              </span>
              <span className="hidden sm:inline">
                <FiClock className="w-3 h-3 inline mr-1" />
                Real-time
              </span>
            </div>
          </motion.div>

          {/* Notification Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: notificationStats.total, icon: "📢", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
              { label: "Unread", value: notificationStats.unread, icon: "🔔", color: "text-rose-400", bgColor: "bg-rose-500/20" },
              { label: "High Priority", value: notificationStats.highPriority, icon: "⚠️", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
              { label: "Today", value: notificationStats.today, icon: "📅", color: "text-teal-400", bgColor: "bg-teal-500/20" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <span className={stat.color}>{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <h3 className={`text-lg font-semibold ${stat.color}`}>
                      {stat.value}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-2 rounded-xl text-sm transition-all ${
                    filter === "all" 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20" 
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-3 py-2 rounded-xl text-sm transition-all ${
                    filter === "unread" 
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Unread
                </button>
                {Object.entries(notificationTypes).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-2 rounded-xl text-sm transition-all ${
                      filter === key 
                        ? `${type.bgColor} ${type.color} border ${type.borderColor}` 
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="px-3 py-2 bg-rose-500/10 text-rose-400 text-sm rounded-xl hover:bg-rose-500/20 transition border border-rose-500/20 flex items-center gap-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg"
          >
            <div className="p-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">
                {filter === "all" ? "All Notifications" : 
                 filter === "unread" ? "Unread Notifications" : 
                 `${notificationTypes[filter]?.label} Notifications`}
                <span className="text-gray-400 text-sm ml-2">({filteredNotifications.length})</span>
              </h3>
            </div>
            
            <div className="divide-y divide-white/5">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-4 transition-all ${
                      !notification.is_read ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500' : 'bg-transparent'
                    } hover:bg-white/5`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${notificationTypes[notification.type]?.bgColor || 'bg-gray-500/20'}`}>
                          <span className={notificationTypes[notification.type]?.color || 'text-gray-400'}>
                            {notificationTypes[notification.type]?.label.split(' ')[0]}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className={`font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                              {notification.title}
                            </h4>
                            <span className={`px-2 py-0.5 text-[10px] rounded-full ${priorityLevels[notification.priority]?.bgColor} ${priorityLevels[notification.priority]?.color}`}>
                              {priorityLevels[notification.priority]?.label}
                            </span>
                            {!notification.is_read && (
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                            )}
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{getTimeAgo(notification.created_at)}</span>
                            {notification.action_url && (
                              <a 
                                href={notification.action_url}
                                className="text-emerald-400 hover:text-emerald-300 transition"
                              >
                                View Details →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsReadHandler(notification.id)}
                            className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition"
                            title="Mark as read"
                          >
                            <FiCheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotificationHandler(notification.id)}
                          className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition"
                          title="Delete notification"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔔</div>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No notifications</h3>
                  <p className="text-gray-500 text-sm">You're all caught up! New alerts will appear here.</p>
                </div>
              )}
            </div>
          </motion.div>
        </main>

        {/* Notification Settings Modal - FinTrack Style */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Notification Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition"
                >
                  <FiTrash2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <div className="font-semibold text-white text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getSettingDescription(key)}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-400"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-sm border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateNotificationSettings(notificationSettings)}
                    className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for setting descriptions
function getSettingDescription(key) {
  const descriptions = {
    email_notifications: "Receive notifications via email",
    push_notifications: "Receive push notifications in browser",
    billing_reminders: "Get reminders for upcoming bill payments",
    subscription_alerts: "Get alerts about subscription renewals",
    budget_alerts: "Receive alerts when you exceed budget limits"
  };
  return descriptions[key] || "Notification setting";
}

export default NotificationsPage;