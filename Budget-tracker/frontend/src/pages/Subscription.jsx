// SubscriptionsPage.jsx - FinTrack Teal/Navy Theme
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";

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
    { value: "entertainment", label: "🎬 Entertainment", color: "text-violet-300",  bgColor: "bg-violet-900/30" },
    { value: "productivity",  label: "💼 Productivity",  color: "text-blue-300",    bgColor: "bg-blue-900/30" },
    { value: "utilities",     label: "🔧 Utilities",     color: "text-emerald-300", bgColor: "bg-emerald-900/30" },
    { value: "software",      label: "💻 Software",      color: "text-orange-300",  bgColor: "bg-orange-900/30" },
    { value: "fitness",       label: "💪 Fitness",       color: "text-red-300",     bgColor: "bg-red-900/30" },
    { value: "music",         label: "🎵 Music",         color: "text-pink-300",    bgColor: "bg-pink-900/30" },
    { value: "cloud",         label: "☁️ Cloud Storage", color: "text-cyan-300",    bgColor: "bg-cyan-900/30" },
    { value: "education",     label: "📚 Education",     color: "text-yellow-300",  bgColor: "bg-yellow-900/30" },
    { value: "other",         label: "📦 Other",         color: "text-gray-300",    bgColor: "bg-gray-900/30" }
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
    { value: "active",    label: "Active",    color: "text-emerald-300", bgColor: "bg-emerald-900/50" },
    { value: "cancelled", label: "Cancelled", color: "text-red-300",     bgColor: "bg-red-900/50" },
    { value: "paused",    label: "Paused",    color: "text-yellow-300",  bgColor: "bg-yellow-900/50" },
    { value: "expired",   label: "Expired",   color: "text-gray-300",    bgColor: "bg-gray-900/50" }
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
  useEffect(() => { document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto"; }, [mobileSidebarOpen]);

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

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label.split(' ')[0] : "📦";
  };

  const getStatusStyles = (status) => {
    const s = statusOptions.find(s => s.value === status);
    return { color: s?.color || "text-gray-300", bgColor: s?.bgColor || "bg-gray-900/50" };
  };

  const getDaysUntilBilling = (billingDate) => {
    if (!billingDate) return Infinity;
    const billing = new Date(billingDate);
    if (Number.isNaN(billing.getTime())) return Infinity;
    return Math.ceil((billing - new Date()) / (1000 * 60 * 60 * 24));
  };

  // Shared input style
  const inputCls = "w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-gray-200 focus:outline-none focus:border-emerald-500 transition-all";

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0d1117] text-gray-100">
        <AdvancedSidebar user={user} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-emerald-400 text-lg">Loading subscriptions...</div>
        </div>
      </div>
    );
  }

  const statsCards = [
    { title: "Monthly Cost",           value: `₹${stats.totalMonthly.toLocaleString('en-IN')}`, subtitle: "Active subscriptions", icon: "💰", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400" },
    { title: "Yearly Cost",            value: `₹${stats.totalYearly.toLocaleString('en-IN')}`,  subtitle: "Annual total",          icon: "📊", bgColor: "bg-blue-500/20",    textColor: "text-blue-400" },
    { title: "Active Subscriptions",   value: stats.activeSubs,                                  subtitle: "Currently active",      icon: "📱", bgColor: "bg-teal-500/20",   textColor: "text-teal-400" },
    { title: "Upcoming Renewals",      value: stats.upcomingRenewals,                            subtitle: "Next 7 days",           icon: "⏰", bgColor: "bg-yellow-500/20", textColor: "text-yellow-400" }
  ];

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-gray-100">
      <AdvancedSidebar user={user} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 sm:p-4 md:p-6 mt-16 flex flex-col gap-4 md:gap-6">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-400">
                Subscriptions
              </h1>
              <p className="text-sm text-gray-400">Manage your recurring subscriptions and payments</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span><span>Add Subscription</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {statsCards.map((card, index) => (
              <div key={index} className="bg-[#161b22]/80 border border-[#30363d]/60 rounded-xl p-4 shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${card.bgColor} rounded-lg`}>
                    <span className={`${card.textColor} text-lg`}>{card.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{card.title}</p>
                    <h3 className={`text-lg font-semibold ${card.textColor}`}>{card.value}</h3>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-[#161b22]/80 border border-[#30363d]/60 p-3 sm:p-4 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 sm:flex-none bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="all">All Status</option>
                {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Table — desktop */}
          <div className="bg-[#161b22]/80 border border-[#30363d]/60 rounded-xl overflow-hidden shadow-lg">
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#0d1117] text-emerald-600/70 uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left">Service</th>
                    <th className="py-3 px-4 text-left">Amount</th>
                    <th className="py-3 px-4 text-left">Billing Cycle</th>
                    <th className="py-3 px-4 text-left">Category</th>
                    <th className="py-3 px-4 text-left">Next Billing</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((subscription) => {
                    const daysUntilBilling = getDaysUntilBilling(subscription.next_billing_date);
                    return (
                      <tr key={subscription.id} className="border-t border-[#30363d]/50 hover:bg-[#1a2f1a]/30 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getCategoryIcon(subscription.category)}</span>
                            <div>
                              <div className="font-semibold text-white">{subscription.name}</div>
                              <div className="text-xs text-gray-400">{subscription.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-300">₹{safeNumber(subscription.amount).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 capitalize text-gray-300">{subscription.billing_cycle}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${categories.find(c => c.value === subscription.category)?.color || 'text-gray-300'} ${categories.find(c => c.value === subscription.category)?.bgColor || 'bg-gray-900/30'}`}>
                            {subscription.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-300">{subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : "-"}</div>
                          <div className={`text-xs ${daysUntilBilling <= 3 ? 'text-red-400' : daysUntilBilling <= 7 ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {Number.isFinite(daysUntilBilling) && daysUntilBilling >= 0 ? `${daysUntilBilling} days` : '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyles(subscription.status).color} ${getStatusStyles(subscription.status).bgColor}`}>
                            {subscription.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {subscription.status === "active" && (
                              <>
                                <button onClick={() => handleUpdateStatus(subscription.id, "paused")}    className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded hover:bg-yellow-500/30 transition">Pause</button>
                                <button onClick={() => handleUpdateStatus(subscription.id, "cancelled")} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition">Cancel</button>
                              </>
                            )}
                            {subscription.status === "paused" && (
                              <button onClick={() => handleUpdateStatus(subscription.id, "active")} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30 transition">Resume</button>
                            )}
                            <button onClick={() => handleDeleteSubscription(subscription.id)} className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded hover:bg-gray-500/30 transition">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  {subscriptions.length === 0 ? "No subscriptions found. Add your first subscription to get started." : "No subscriptions match your filters."}
                </div>
              )}
            </div>

            {/* Mobile card list */}
            <div className="block sm:hidden">
              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-8 text-gray-400">No subscriptions found.</div>
              )}
              {filteredSubscriptions.map(subscription => (
                <div key={subscription.id} className="p-4 border-b border-[#30363d]/50 hover:bg-[#1a2f1a]/30 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCategoryIcon(subscription.category)}</span>
                      <div>
                        <div className="font-semibold text-white">{subscription.name}</div>
                        <div className="text-xs text-gray-400">{subscription.description}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyles(subscription.status).color} ${getStatusStyles(subscription.status).bgColor}`}>
                      {subscription.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div><span className="text-gray-400">Amount:</span><span className="ml-2 font-semibold text-emerald-300">₹{safeNumber(subscription.amount).toLocaleString('en-IN')}</span></div>
                    <div><span className="text-gray-400">Cycle:</span><span className="ml-2 capitalize">{subscription.billing_cycle}</span></div>
                    <div><span className="text-gray-400">Next Bill:</span><span className="ml-2">{subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : "-"}</span></div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {subscription.status === "active" && (
                      <>
                        <button onClick={() => handleUpdateStatus(subscription.id, "paused")}    className="flex-1 px-2 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-lg hover:bg-yellow-500/30 transition">Pause</button>
                        <button onClick={() => handleUpdateStatus(subscription.id, "cancelled")} className="flex-1 px-2 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition">Cancel</button>
                      </>
                    )}
                    {subscription.status === "paused" && (
                      <button onClick={() => handleUpdateStatus(subscription.id, "active")} className="flex-1 px-2 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg hover:bg-emerald-500/30 transition">Resume</button>
                    )}
                    <button onClick={() => handleDeleteSubscription(subscription.id)} className="flex-1 px-2 py-1.5 bg-gray-500/20 text-gray-400 text-xs rounded-lg hover:bg-gray-500/30 transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-[#161b22]/80 border border-[#30363d]/60 rounded-xl p-4 sm:p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-emerald-300 mb-4">📊 Subscription Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {categories.map(category => {
                const categorySubs  = (subscriptions || []).filter(sub => sub.category === category.value && sub.status === "active");
                const categoryTotal = categorySubs.reduce((sum, sub) => sum + safeNumber(sub.amount), 0);
                return (
                  <div key={category.value} className={`rounded-lg p-4 border border-[#30363d]/50 ${category.bgColor}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{category.label.split(' ')[0]}</span>
                      <span className={`text-sm font-semibold ${category.color}`}>{category.label.split(' ').slice(1).join(' ')}</span>
                    </div>
                    <div className={`text-2xl font-bold ${category.color}`}>₹{categoryTotal.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-gray-400">{categorySubs.length} subscriptions</div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[11000] p-4">
            <div className="bg-[#0d1117] border border-[#30363d] p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-emerald-300 mb-4">Add New Subscription</h2>
              <form onSubmit={handleAddSubscription} className="space-y-4">
                <input type="text" placeholder="Service Name (e.g., Netflix)" value={newSubscription.name} onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })} required className={inputCls} />
                <input type="number" step="0.01" placeholder="Amount" value={newSubscription.amount} onChange={(e) => setNewSubscription({ ...newSubscription, amount: e.target.value })} required className={inputCls} />
                <select value={newSubscription.billing_cycle} onChange={(e) => setNewSubscription({ ...newSubscription, billing_cycle: e.target.value })} className={inputCls}>
                  <option value="">Select Billing Cycle</option>
                  {billingCycles.map((cycle) => <option key={cycle.value} value={cycle.value}>{cycle.label}</option>)}
                </select>
                <select value={newSubscription.category} onChange={(e) => setNewSubscription({ ...newSubscription, category: e.target.value })} className={inputCls}>
                  <option value="">Select Category</option>
                  {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
                <input type="date" value={newSubscription.next_billing_date} onChange={(e) => setNewSubscription({ ...newSubscription, next_billing_date: e.target.value })} required className={inputCls} />
                <select value={newSubscription.status} onChange={(e) => setNewSubscription({ ...newSubscription, status: e.target.value })} className={inputCls}>
                  <option value="">Select Status</option>
                  {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <textarea placeholder="Description (optional)" value={newSubscription.description} onChange={(e) => setNewSubscription({ ...newSubscription, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-all">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-all">Add Subscription</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
