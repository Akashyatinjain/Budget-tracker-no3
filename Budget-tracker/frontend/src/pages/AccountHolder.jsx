import React, { useState, useEffect } from 'react';
import { FaUser, FaBell, FaShieldAlt, FaPalette, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { MdCurrencyExchange } from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import AdvancedSidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { FiZap, FiShield, FiClock, FiTrendingUp } from 'react-icons/fi';
import { useAuth, api } from '../context/AuthContext';

const AccountHolderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    currency: "INR",
    language: "en",
    timezone: "Asia/Kolkata"
  });

  useEffect(() => {
    fetchUser();
  }, [token]);

  const fetchUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get("/api/users/me");
      const userData = res.data.user || res.data;
      setUser(userData);
      setFormData({
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
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put("/api/users/profile", formData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchUser();
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      currency: user?.currency || "INR",
      language: user?.language || "en",
      timezone: user?.timezone || "Asia/Kolkata"
    });
    setIsEditing(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser /> },
    { id: 'preferences', label: 'App Preferences', icon: <FaPalette /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'security', label: 'Security', icon: <FaShieldAlt /> },
    { id: 'export', label: 'Data Export', icon: <FaDownload /> }
  ];

  const currentUser = user || authUser || {};

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
      <AdvancedSidebar
        user={currentUser}
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
            className="flex items-center gap-4"
          >
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <FaArrowLeft className="text-emerald-400" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">My Profile</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  <FiZap className="w-3 h-3" />
                  AI Insights Active
                </span>
              </div>
              <p className="text-gray-400 text-sm">Manage your account information and preferences</p>
            </div>
          </motion.div>



          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - FinTrack Style */}
            <div className="lg:w-64 flex-shrink-0">
              {/* Mobile Dropdown */}
              <div className="block lg:hidden mb-4">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-3 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                >
                  <option value="profile">👤 Profile</option>
                  <option value="preferences">🎨 App Preferences</option>
                  <option value="notifications">🔔 Notifications</option>
                  <option value="security">🛡️ Security</option>
                  <option value="export">📤 Data Export</option>
                </select>
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden lg:block bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg">
                <nav className="space-y-1.5">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        activeTab === tab.id
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className={activeTab === tab.id ? "text-emerald-400" : "text-gray-500"}>
                        {tab.icon}
                      </span>
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg"
              >
                {/* Profile Information */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Edit Profile
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-400 text-sm mb-1.5">First Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                          />
                        ) : (
                          <div className="bg-white/5 rounded-xl px-4 py-3 text-white border border-white/5">
                            {currentUser?.first_name || 'Not set'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-1.5">Last Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                          />
                        ) : (
                          <div className="bg-white/5 rounded-xl px-4 py-3 text-white border border-white/5">
                            {currentUser?.last_name || 'Not set'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-1.5">Email Address</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                          />
                        ) : (
                          <div className="bg-white/5 rounded-xl px-4 py-3 text-white border border-white/5">
                            {currentUser?.email || 'Not set'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-1.5">Phone Number</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                          />
                        ) : (
                          <div className="bg-white/5 rounded-xl px-4 py-3 text-white border border-white/5">
                            {currentUser?.phone || 'Not set'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-1.5">Preferred Currency</label>
                        {isEditing ? (
                          <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="INR">INR - Indian Rupee</option>
                          </select>
                        ) : (
                          <div className="bg-white/5 rounded-xl px-4 py-3 text-white border border-white/5 flex items-center gap-2">
                            <MdCurrencyExchange className="text-emerald-400" />
                            {currentUser?.currency || 'INR'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-1.5">Language</label>
                        {isEditing ? (
                          <select
                            value={formData.language}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        ) : (
                          <div className="bg-white/5 rounded-xl px-4 py-3 text-white border border-white/5">
                            {currentUser?.language || 'en'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-1.5">Timezone</label>
                        {isEditing ? (
                          <select
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                          >
                            <option value="Asia/Kolkata">Asia/Kolkata</option>
                            <option value="America/New_York">America/New_York</option>
                            <option value="Europe/London">Europe/London</option>
                            <option value="Australia/Sydney">Australia/Sydney</option>
                          </select>
                        ) : (
                          <div className="bg-white/5 rounded-xl px-4 py-3 text-white border border-white/5">
                            {currentUser?.timezone || 'Asia/Kolkata'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <FiShield className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-gray-400">Bank-grade security</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiClock className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active
                      </span>
                    </div>
                  </div>
                )}

                {/* App Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">App Preferences</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <h3 className="text-sm font-medium text-white mb-2">Theme Preferences</h3>
                        <p className="text-sm text-gray-400">Dark mode is currently active. Customize your experience.</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <h3 className="text-sm font-medium text-white mb-2">Notification Settings</h3>
                        <p className="text-sm text-gray-400">Manage how you receive notifications from FinTrack.</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <h3 className="text-sm font-medium text-white mb-2">AI Insights</h3>
                        <p className="text-sm text-gray-400">AI-powered insights are currently active. Get smart financial recommendations.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Notifications</h2>
                    <div className="space-y-3">
                      {[
                        { title: "Budget Alert", description: "You've used 80% of your Food budget this month.", time: "2 hours ago" },
                        { title: "Savings Milestone", description: "Congratulations! You've saved ₹50,000 this year.", time: "1 day ago" },
                        { title: "Subscription Reminder", description: "Netflix subscription renews in 3 days.", time: "2 days ago" },
                      ].map((notification, index) => (
                        <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                              <p className="text-xs text-gray-400 mt-1">{notification.description}</p>
                            </div>
                            <span className="text-[10px] text-gray-500">{notification.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white">Two-Factor Authentication</h3>
                            <p className="text-xs text-gray-400">Add an extra layer of security to your account</p>
                          </div>
                          <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-all">
                            Enable
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white">Change Password</h3>
                            <p className="text-xs text-gray-400">Update your password regularly for better security</p>
                          </div>
                          <button className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all">
                            Change
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white">Active Sessions</h3>
                            <p className="text-xs text-gray-400">Manage devices where you're logged in</p>
                          </div>
                          <span className="text-xs text-emerald-400">1 active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Tab */}
                {activeTab === 'export' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white">Data Export</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white">Export Transactions</h3>
                            <p className="text-xs text-gray-400">Download all your transactions as CSV</p>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20">
                            <FaDownload className="inline mr-2" /> Export
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white">Export Financial Report</h3>
                            <p className="text-xs text-gray-400">Download detailed financial summary PDF</p>
                          </div>
                          <button className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all">
                            <FaDownload className="inline mr-2" /> Generate
                          </button>
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

export default AccountHolderPage;