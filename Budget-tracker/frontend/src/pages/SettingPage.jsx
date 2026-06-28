import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth, api } from "../context/AuthContext";
import { motion } from "framer-motion";
import { 
  FiUser, FiLock, FiSettings, FiShield, FiDatabase, FiInfo, 
  FiZap, FiShield as FiShieldIcon, FiClock, FiSave, FiDownload,
  FiAlertTriangle, FiLogOut, FiChevronRight
} from "react-icons/fi";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    currency: "INR",
    language: "en",
    timezone: "Asia/Kolkata"
  });

  const [securityData, setSecurityData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [preferences, setPreferences] = useState({
    theme: "dark",
    dashboard_layout: "standard",
    default_view: "dashboard",
    weekly_report: true,
    monthly_report: false,
    budget_alerts: true,
    spending_notifications: true,
    email_notifications: true,
    push_notifications: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    data_sharing: false,
    analytics_tracking: true,
    marketing_emails: false,
    public_profile: false,
    show_balances: true,
    export_data: true
  });

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

  const currencies = [
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" }
  ];

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" }
  ];

  const timezones = [
    { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" }
  ];

  const themes = [
    { value: "dark", label: "Dark", description: "Default dark theme" },
    { value: "light", label: "Light", description: "Light mode" },
    { value: "auto", label: "Auto", description: "Follow system preference" }
  ];

  const dashboardLayouts = [
    { value: "standard", label: "Standard", description: "Default layout with all widgets" },
    { value: "minimal", label: "Minimal", description: "Clean layout with essential info" },
    { value: "detailed", label: "Detailed", description: "Comprehensive view with charts" }
  ];

  const defaultViews = [
    { value: "dashboard", label: "Dashboard", description: "Start with overview" },
    { value: "transactions", label: "Transactions", description: "Start with transactions" },
    { value: "analytics", label: "Analytics", description: "Start with analytics" }
  ];

  useEffect(() => {
    fetchUser();
    fetchUserPreferences();
  }, [token]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
  }, [mobileSidebarOpen]);

  const fetchUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get("/api/users/me");
      const userData = res.data.user || res.data;
      setProfileData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        currency: userData.currency || "INR",
        language: userData.language || "en",
        timezone: userData.timezone || "Asia/Kolkata"
      });
    } catch (err) {
      console.error("Fetch user error:", err.response?.data || err.message);
      showMessage("error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    if (!token) return;
    try {
      const res = await api.get("/api/users/preferences");
      const prefs = res.data.preferences || {};
      setPreferences(prev => ({ ...prev, ...prefs }));
      
      const privacyRes = await api.get("/api/users/privacy");
      const privacy = privacyRes.data.settings || {};
      setPrivacySettings(prev => ({ ...prev, ...privacy }));
    } catch (err) {
      console.error("Fetch preferences error:", err);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await axios.put(`${VITE_BASE_URL}/api/users/profile`, profileData, axiosConfig);
      showMessage("success", "Profile updated successfully");
    } catch (err) {
      console.error("Update profile error:", err);
      showMessage("error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (securityData.new_password !== securityData.confirm_password) {
      showMessage("error", "New passwords do not match");
      return;
    }
    
    if (securityData.new_password.length < 6) {
      showMessage("error", "Password must be at least 6 characters long");
      return;
    }

    setSaving(true);
    
    try {
      await axios.put(`${VITE_BASE_URL}/api/users/password`, securityData, axiosConfig);
      showMessage("success", "Password updated successfully");
      setSecurityData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
    } catch (err) {
      console.error("Change password error:", err);
      showMessage("error", err.response?.data?.error || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setSaving(true);
    
    try {
      await axios.put(`${VITE_BASE_URL}/api/user-preferences`, preferences, axiosConfig);
      showMessage("success", "Preferences updated successfully");
    } catch (err) {
      console.error("Update preferences error:", err);
      showMessage("error", "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setSaving(true);
    
    try {
      await axios.put(`${VITE_BASE_URL}/api/privacy-settings`, privacySettings, axiosConfig);
      showMessage("success", "Privacy settings updated successfully");
    } catch (err) {
      console.error("Update privacy settings error:", err);
      showMessage("error", "Failed to update privacy settings");
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await axios.get(`${VITE_BASE_URL}/api/export-data`, {
        ...axiosConfig,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `budget-data-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showMessage("success", "Data exported successfully");
    } catch (err) {
      console.error("Export data error:", err);
      showMessage("error", "Failed to export data");
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.")) {
      return;
    }

    const confirmation = prompt("Please type 'DELETE' to confirm account deletion:");
    if (confirmation !== "DELETE") {
      showMessage("error", "Account deletion cancelled");
      return;
    }

    try {
      await axios.delete(`${VITE_BASE_URL}/api/users/account`, axiosConfig);
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err) {
      console.error("Delete account error:", err);
      showMessage("error", "Failed to delete account");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/sign-in");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "security", label: "Security", icon: FiLock },
    { id: "preferences", label: "Preferences", icon: FiSettings },
    { id: "privacy", label: "Privacy", icon: FiShield },
    { id: "data", label: "Data", icon: FiDatabase },
    { id: "about", label: "About", icon: FiInfo }
  ];

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
            <FiSettings className="w-6 h-6" />
            <span>Loading settings...</span>
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
                <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  <FiZap className="w-3 h-3" />
                  AI Insights Active
                </span>
              </div>
              <p className="text-gray-400 text-sm">Manage your account and application preferences</p>
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
                <FiShieldIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Account Security</p>
                <p className="text-xs text-gray-400">Your account is protected with bank-grade encryption</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FiShieldIcon className="w-3 h-3 text-emerald-400" />
                Secure
              </span>
              <span className="hidden sm:inline">
                <FiClock className="w-3 h-3 inline mr-1" />
                Last login: Today
              </span>
            </div>
          </motion.div>

          {/* Message Alert */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${
                message.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {message.text}
            </motion.div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation - FinTrack Style */}
            <div className="lg:w-64 flex-shrink-0">
              {/* Mobile Dropdown */}
              <div className="block lg:hidden mb-4">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-3 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                >
                  {tabs.map(tab => (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden lg:block bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg">
                <nav className="space-y-1.5">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                          activeTab === tab.id
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${activeTab === tab.id ? "text-emerald-400" : "text-gray-500"}`} />
                        <span className="font-medium text-sm">{tab.label}</span>
                        {activeTab === tab.id && (
                          <FiChevronRight className="w-4 h-4 ml-auto text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg"
              >
                
                {/* Profile Settings */}
                {activeTab === "profile" && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">First Name</label>
                          <input
                            type="text"
                            value={profileData.first_name}
                            onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
                          <input
                            type="text"
                            value={profileData.last_name}
                            onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          placeholder="Enter your email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Phone Number</label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Currency</label>
                          <select
                            value={profileData.currency}
                            onChange={(e) => setProfileData({...profileData, currency: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          >
                            {currencies.map(currency => (
                              <option key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Language</label>
                          <select
                            value={profileData.language}
                            onChange={(e) => setProfileData({...profileData, language: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          >
                            {languages.map(lang => (
                              <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Timezone</label>
                          <select
                            value={profileData.timezone}
                            onChange={(e) => setProfileData({...profileData, timezone: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          >
                            {timezones.map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                          <FiSave className="w-4 h-4" />
                          {saving ? "Saving..." : "Save Profile"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === "security" && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Current Password</label>
                        <input
                          type="password"
                          value={securityData.current_password}
                          onChange={(e) => setSecurityData({...securityData, current_password: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          placeholder="Enter current password"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">New Password</label>
                        <input
                          type="password"
                          value={securityData.new_password}
                          onChange={(e) => setSecurityData({...securityData, new_password: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          placeholder="Enter new password"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Confirm New Password</label>
                        <input
                          type="password"
                          value={securityData.confirm_password}
                          onChange={(e) => setSecurityData({...securityData, confirm_password: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          placeholder="Confirm new password"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                          <FiLock className="w-4 h-4" />
                          {saving ? "Updating..." : "Change Password"}
                        </button>
                      </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5">
                      <h3 className="text-lg font-semibold text-rose-400 mb-4 flex items-center gap-2">
                        <FiAlertTriangle className="w-5 h-5" />
                        Danger Zone
                      </h3>
                      <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                        <p className="text-rose-400 text-sm mb-3">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button
                          onClick={deleteAccount}
                          className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all duration-200"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Settings */}
                {activeTab === "preferences" && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Application Preferences</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Theme</label>
                          <select
                            value={preferences.theme}
                            onChange={(e) => setPreferences({...preferences, theme: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          >
                            {themes.map(theme => (
                              <option key={theme.value} value={theme.value}>{theme.label}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">{themes.find(t => t.value === preferences.theme)?.description}</p>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Dashboard Layout</label>
                          <select
                            value={preferences.dashboard_layout}
                            onChange={(e) => setPreferences({...preferences, dashboard_layout: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                          >
                            {dashboardLayouts.map(layout => (
                              <option key={layout.value} value={layout.value}>{layout.label}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">{dashboardLayouts.find(l => l.value === preferences.dashboard_layout)?.description}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Default View</label>
                        <select
                          value={preferences.default_view}
                          onChange={(e) => setPreferences({...preferences, default_view: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                        >
                          {defaultViews.map(view => (
                            <option key={view.value} value={view.value}>{view.label}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">{defaultViews.find(v => v.value === preferences.default_view)?.description}</p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Notifications</h3>
                        {[
                          { key: 'weekly_report', label: 'Weekly Reports', description: 'Receive weekly financial summary' },
                          { key: 'monthly_report', label: 'Monthly Reports', description: 'Receive monthly comprehensive reports' },
                          { key: 'budget_alerts', label: 'Budget Alerts', description: 'Get notified when exceeding budgets' },
                          { key: 'spending_notifications', label: 'Spending Notifications', description: 'Alerts for unusual spending' },
                          { key: 'email_notifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                          { key: 'push_notifications', label: 'Push Notifications', description: 'Receive browser push notifications' }
                        ].map(setting => (
                          <div key={setting.key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div>
                              <div className="font-semibold text-white text-sm">{setting.label}</div>
                              <div className="text-xs text-gray-400">{setting.description}</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={preferences[setting.key]}
                                onChange={(e) => setPreferences({...preferences, [setting.key]: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-400"></div>
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handlePreferencesUpdate}
                          disabled={saving}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                          <FiSave className="w-4 h-4" />
                          {saving ? "Saving..." : "Save Preferences"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === "privacy" && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Privacy & Data Settings</h2>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {[
                          { key: 'data_sharing', label: 'Data Sharing', description: 'Share anonymous usage data to help improve the app' },
                          { key: 'analytics_tracking', label: 'Analytics Tracking', description: 'Allow tracking of app usage analytics' },
                          { key: 'marketing_emails', label: 'Marketing Emails', description: 'Receive promotional emails and updates' },
                          { key: 'public_profile', label: 'Public Profile', description: 'Make your profile visible to other users' },
                          { key: 'show_balances', label: 'Show Balances', description: 'Display account balances in dashboard' },
                          { key: 'export_data', label: 'Allow Data Export', description: 'Enable exporting your financial data' }
                        ].map(setting => (
                          <div key={setting.key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div>
                              <div className="font-semibold text-white text-sm">{setting.label}</div>
                              <div className="text-xs text-gray-400">{setting.description}</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={privacySettings[setting.key]}
                                onChange={(e) => setPrivacySettings({...privacySettings, [setting.key]: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-400"></div>
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handlePrivacyUpdate}
                          disabled={saving}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                          <FiSave className="w-4 h-4" />
                          {saving ? "Saving..." : "Save Privacy Settings"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Management */}
                {activeTab === "data" && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Data Management</h2>
                    <div className="space-y-6">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-blue-400 mb-2">Export Your Data</h3>
                        <p className="text-blue-300 text-sm mb-4">
                          Download all your financial data including transactions, budgets, and subscriptions in a portable format.
                        </p>
                        <button
                          onClick={exportData}
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                        >
                          <FiDownload className="w-4 h-4" />
                          Export All Data
                        </button>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-emerald-400 mb-2">Data Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-2xl font-bold text-emerald-400">127</div>
                            <div className="text-xs text-gray-400">Transactions</div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-2xl font-bold text-blue-400">8</div>
                            <div className="text-xs text-gray-400">Budgets</div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-2xl font-bold text-teal-400">5</div>
                            <div className="text-xs text-gray-400">Subscriptions</div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-2xl font-bold text-yellow-400">12MB</div>
                            <div className="text-xs text-gray-400">Total Data</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* About */}
                {activeTab === "about" && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">About FinTrack</h2>
                    <div className="space-y-6">
                      <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                        <div className="mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <FiZap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">FinTrack</h3>
                              <p className="text-emerald-400 text-sm">Version 2.1.0</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-300 mb-4">
                          A sophisticated finance management platform designed for professionals who value precision, security, and actionable intelligence.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <h4 className="font-semibold text-white mb-3">Features</h4>
                          <ul className="text-sm text-gray-300 space-y-2">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Real-time expense tracking
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              AI-powered insights
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Bank-grade security
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Multi-currency support
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Comprehensive analytics
                            </li>
                          </ul>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <h4 className="font-semibold text-white mb-3">Support</h4>
                          <div className="text-sm text-gray-300 space-y-2">
                            <p>📧 support@fintrack.com</p>
                            <p>🌐 help.fintrack.com</p>
                            <p>📱 +91 9876543210</p>
                            <p className="text-xs text-gray-500 mt-3">
                              © 2026 FinTrack. All rights reserved.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;