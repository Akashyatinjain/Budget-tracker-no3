import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBell, FaUserCircle, FaCog, FaUser, FaCreditCard } from "react-icons/fa";
import { FiMenu, FiChevronDown, FiTrendingUp, FiZap, FiShield, FiSearch, FiChevronRight, FiCommand, FiSun, FiMoon } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { applyTheme } from "../App";
import toast from "react-hot-toast";

const Header = ({ onMobileToggle, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("fintrack_theme") || "dark");
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const username = user?.username || user?.name || user?.email?.split('@')[0] || "Akash Jain";
  const email = user?.email || "akash.jain@fintrack.io";
  const userInitial = username.charAt(0).toUpperCase();

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      try { onLogout(); } catch {}
    }
    logout();
    navigate("/sign-in");
  };

  const handleToggleTheme = () => {
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
    toast.success(`✨ Switched to ${nextTheme === "light" ? "Light Mode" : "Dark Mode"}`);
  };

  // Enterprise Breadcrumbs Hierarchy
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return [{ label: "FinTrack", route: "/dashboard" }, { label: "Dashboard", route: "/dashboard" }];
    if (path === "/transactions") return [{ label: "Money", route: "/transactions" }, { label: "Transactions", route: "/transactions" }];
    if (path === "/subscriptions") return [{ label: "Money", route: "/subscriptions" }, { label: "Subscriptions", route: "/subscriptions" }];
    if (path === "/reports") return [{ label: "Analytics", route: "/reports" }, { label: "Reports", route: "/reports" }];
    if (path === "/settings") return [{ label: "System", route: "/settings" }, { label: "Settings", route: "/settings" }];
    if (path === "/budgets") return [{ label: "Money", route: "/budgets" }, { label: "Budgets", route: "/budgets" }];
    if (path === "/trends") return [{ label: "Analytics", route: "/trends" }, { label: "Trends", route: "/trends" }];
    if (path === "/currencies") return [{ label: "Money", route: "/currencies" }, { label: "Currencies", route: "/currencies" }];
    if (path === "/friend-loans") return [{ label: "Money", route: "/friend-loans" }, { label: "Friend Loans", route: "/friend-loans" }];
    if (path === "/emi-calculator") return [{ label: "Money", route: "/emi-calculator" }, { label: "EMI Calculator", route: "/emi-calculator" }];
    if (path === "/notifications") return [{ label: "System", route: "/notifications" }, { label: "Notifications", route: "/notifications" }];
    return [{ label: "FinTrack", route: "/dashboard" }, { label: "Overview", route: "/dashboard" }];
  };

  const breadcrumbs = getBreadcrumbs();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notifications
  const notifications = [
    { id: 1, title: "Budget Alert", message: "You've used 88% of Food budget", time: "5 min ago", read: false },
    { id: 2, title: "Subscription Due", message: "Netflix renews in 3 days", time: "1 hour ago", read: false },
    { id: 3, title: "Salary Payout", message: "₹1,25,000 credited to account", time: "3 hours ago", read: false },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 bg-[#070d14]/95 backdrop-blur-xl border-b border-white/10 text-white shadow-xl">
      
      {/* Left Section: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onMobileToggle}
          className="md:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="text-xl" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-all">
            <FiTrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:block font-bold text-base text-white tracking-tight">FinTrack</span>
        </Link>

        {/* 🗺️ Enterprise Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-white/10 text-xs font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <FiChevronRight size={12} className="text-slate-500" />}
              <span className={idx === breadcrumbs.length - 1 ? "text-white font-bold" : "text-slate-400"}>
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Middle Section: ⌘ Global Command Palette Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search transactions, budgets, reports..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-14 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400 font-mono border border-white/10">
            <FiCommand size={10} />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Section: Theme Toggle, AI Indicator, Notifications & Profile */}
      <div className="flex items-center gap-2.5">
        
        {/* ☀️ / 🌙 Header Theme Toggle Button */}
        <button
          onClick={handleToggleTheme}
          className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center border border-white/5"
          title={`Switch to ${currentTheme === "light" ? "Dark Mode" : "Light Mode"}`}
          aria-label="Toggle theme"
        >
          {currentTheme === "light" ? (
            <FiMoon className="text-indigo-500 text-base" />
          ) : (
            <FiSun className="text-amber-400 text-base" />
          )}
        </button>

        {/* 🔔 Notifications Button with Live Numeric Badge */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5"
            aria-label="Notifications"
          >
            <FaBell className="text-base" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md border-2 border-[#070d14]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-[#0a1017] border border-white/15 shadow-2xl z-50 text-white custom-scrollbar">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-bold text-sm text-white">Live Alerts</h3>
                <span className="text-xs text-emerald-400 font-semibold cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="divide-y divide-white/5">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 hover:bg-white/5 transition cursor-pointer ${!notif.read ? 'bg-emerald-500/10' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? 'bg-slate-600' : 'bg-emerald-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${notif.read ? 'text-slate-400' : 'text-white'}`}>{notif.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-slate-500 mt-1.5">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs">No active notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 👤 Rich Profile Menu */}
        {isAuthenticated ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/10 transition-all group border border-white/5"
              aria-label="Profile menu"
            >
              {(user?.avatar_url || user?.avatar || user?.profile_picture) ? (
                <img 
                  src={user?.avatar_url || user?.avatar || user?.profile_picture} 
                  alt={username}
                  className="w-8 h-8 rounded-xl object-cover shadow-md ring-1 ring-emerald-500/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md font-bold text-white text-xs">
                  {userInitial}
                </div>
              )}
              <div className="hidden md:block text-left pr-1">
                <div className="text-xs font-bold text-white leading-tight">{username}</div>
                <div className="text-[10px] text-emerald-400 font-medium">Verified Pro</div>
              </div>
              <FiChevronDown className={`hidden md:block text-slate-400 text-xs transition-transform duration-200 group-hover:text-white ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0a1017] border border-white/15 shadow-2xl overflow-hidden z-50 text-white">
                {/* Header Info */}
                <div className="p-4 border-b border-white/10 bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    {(user?.avatar_url || user?.avatar || user?.profile_picture) ? (
                      <img 
                        src={user?.avatar_url || user?.avatar || user?.profile_picture} 
                        alt={username}
                        className="w-10 h-10 rounded-xl object-cover shadow-md ring-2 ring-emerald-500/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                        {userInitial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{username}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{email}</div>
                    </div>
                  </div>
                </div>

                <div className="py-2 text-xs space-y-1">
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <FaUser className="text-emerald-400" />
                    My Account Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <FaCog className="text-cyan-400" />
                    System Preferences
                  </Link>
                  <Link
                    to="/subscriptions"
                    className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <FaCreditCard className="text-purple-400" />
                    Billing & Subscriptions
                  </Link>

                  <div className="border-t border-white/10 my-1.5" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-all font-semibold"
                  >
                    <FaSignOutAlt className="text-rose-400" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/sign-in" className="px-4 py-2 rounded-xl bg-white/5 text-white text-xs font-semibold hover:bg-white/10 transition-all">Sign In</Link>
            <Link to="/sign-up" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md">Get Started</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;