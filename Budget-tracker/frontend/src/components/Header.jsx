import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBell, FaUserCircle, FaCog, FaUser } from "react-icons/fa";
import { FiMenu, FiChevronDown, FiTrendingUp, FiZap, FiShield } from "react-icons/fi";
import logo from "../assets/logo.svg";
import { useAuth } from "../context/AuthContext";

const Header = ({ onMobileToggle, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const username = user?.username || user?.email?.split('@')[0] || "User";
  const userInitial = username.charAt(0).toUpperCase();

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      try { onLogout(); } catch {}
    }
    logout();
    navigate("/sign-in");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard" || path === "/app/dashboard") return "Dashboard";
    if (path === "/transactions" || path === "/app/transactions") return "Transactions";
    if (path === "/subscriptions" || path === "/app/subscriptions") return "Subscriptions";
    if (path === "/reports" || path === "/app/reports") return "Reports";
    if (path === "/profile" || path === "/app/account") return "Profile";
    if (path === "/analytics" || path === "/app/analytics") return "Analytics";
    if (path === "/settings" || path === "/app/settings") return "Settings";
    if (path === "/budgets") return "Budgets";
    if (path === "/trends") return "Trends";
    if (path === "/currencies") return "Currencies";
    if (path === "/notifications") return "Notifications";
    return "";
  };

  // Close dropdowns when clicking outside
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

  // Sample notifications for demo
  const notifications = [
    { id: 1, title: "Budget Alert", message: "You've used 80% of Food budget", time: "2 min ago", read: false },
    { id: 2, title: "Subscription Due", message: "Netflix renews in 3 days", time: "1 hour ago", read: false },
    { id: 3, title: "Savings Milestone", message: "You saved ₹50,000 this year", time: "2 hours ago", read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/5 text-white shadow-lg">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileToggle}
          className="md:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="text-xl" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-all duration-300">
            <FiTrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold text-white tracking-tight">FinTrack</span>
            <span className="block text-[8px] text-emerald-400 uppercase tracking-wider font-medium">Trusted by professionals</span>
          </div>
        </Link>

        <div className="hidden md:block ml-4 pl-4 border-l border-white/5">
          <h1 className="text-base font-medium text-white">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* AI Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">AI Active</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
            aria-label="Notifications"
          >
            <FaBell className="text-lg" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#0a0a0f]"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-[#111118] border border-white/10 shadow-2xl">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <button className="text-xs text-emerald-400 hover:text-emerald-300 transition">
                    Mark all read
                  </button>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 hover:bg-white/5 transition ${!notif.read ? 'bg-emerald-500/5' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${notif.read ? 'bg-gray-600' : 'bg-emerald-400'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-white'}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-gray-600 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        {isAuthenticated ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 group"
              aria-label="Profile menu"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-sm font-bold text-white">{userInitial}</span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-white leading-tight">{username}</div>
                <div className="text-[10px] text-emerald-400">Active</div>
              </div>
              <FiChevronDown className={`hidden md:block text-gray-400 text-sm transition-transform duration-200 group-hover:text-white ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#111118] border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <span className="text-sm font-bold text-white">{userInitial}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{username}</div>
                      <div className="text-[10px] text-emerald-400">● Active</div>
                    </div>
                  </div>
                </div>
                <div className="py-1.5" role="menu">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200"
                    onClick={() => setShowProfileMenu(false)}
                    role="menuitem"
                  >
                    <FaUser className="text-emerald-400 w-4 h-4" />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200"
                    onClick={() => setShowProfileMenu(false)}
                    role="menuitem"
                  >
                    <FaCog className="text-emerald-400 w-4 h-4" />
                    Settings
                  </Link>
                  <div className="border-t border-white/5 my-1.5"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
                    role="menuitem"
                  >
                    <FaSignOutAlt className="text-rose-400 w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/sign-in"
              className="px-4 py-2 rounded-xl bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-all duration-200 border border-white/5"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-500/20"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;