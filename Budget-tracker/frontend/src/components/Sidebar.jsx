import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FiHome,
  FiBarChart2,
  FiDollarSign,
  FiBell,
  FiSettings,
  FiX,
  FiFileText,
  FiUsers,
  FiLogOut,
  FiTrendingUp,
  FiRepeat,
  FiGlobe,
  FiClock,
  FiSearch,
  FiMenu,
  FiShield,
  FiChevronRight,
  FiChevronDown,
  FiActivity,
  FiPieChart,
  FiDownload,
  FiUser,
  FiLock,
  FiSliders,
  FiDatabase,
  FiInfo
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";

const DEFAULT_COLLAPSED_KEY = "app.sidebar.collapsed";

const buildMenu = (role, notificationsCount = 0) => [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard",     label: "Dashboard",     icon: <FiHome />,       route: "/dashboard" },
      { id: "analytics",    label: "Analytics",     icon: <FiBarChart2 />,  route: "/analytics" },
      { id: "trends",       label: "Trends",        icon: <FiTrendingUp />, route: "/trends" },
    ],
  },
  {
    id: "money",
    label: "Money",
    items: [
      { id: "transactions",  label: "Transactions",  icon: <FiDollarSign />, route: "/transactions" },
      { id: "budgets",       label: "Budgets",       icon: <FiRepeat />,     route: "/budgets" },
      { id: "subscriptions", label: "Subscriptions", icon: <FiClock />,      route: "/subscriptions" },
      { id: "currencies",    label: "Currencies",    icon: <FiGlobe />,      route: "/currencies" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    items: [
      { 
        id: "reports", 
        label: "Reports", 
        icon: <FiFileText />, 
        route: "/reports",
        subItems: [
          { id: "rep-overview", label: "Overview", icon: <FiPieChart />, route: "/reports" },
          { id: "rep-monthly", label: "Monthly Trends", icon: <FiBarChart2 />, route: "/reports" },
          { id: "rep-export", label: "Export PDF/CSV", icon: <FiDownload />, route: "/reports" },
        ]
      },
      ...(role === "admin"
        ? [{ id: "manage", label: "Admin Panel", icon: <FiUsers />, route: "/admin" }]
        : []),
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "notifications",
        label: "Notifications",
        icon: <FiBell />,
        route: "/notifications",
        badge: notificationsCount,
      },
      { 
        id: "settings", 
        label: "Settings", 
        icon: <FiSettings />, 
        route: "/settings",
        subItems: [
          { id: "set-profile", label: "Profile & Identity", icon: <FiUser />, route: "/settings" },
          { id: "set-security", label: "Security & 2FA", icon: <FiLock />, route: "/settings" },
          { id: "set-pref", label: "Preferences", icon: <FiSliders />, route: "/settings" },
        ]
      },
    ],
  },
];

export default function AdvancedSidebar({
  user,
  role = "user",
  collapsed: collapsedProp = false,
  onNavigate = () => {},
  notificationsCount = 0,
  mobileOpen = false,
  onMobileClose = () => {},
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const v = localStorage.getItem(DEFAULT_COLLAPSED_KEY);
      return v ? JSON.parse(v) : collapsedProp;
    } catch {
      return collapsedProp;
    }
  });
  const [query, setQuery] = useState("");
  const [internalMobileOpen, setInternalMobileOpen] = useState(mobileOpen);
  const [imgError, setImgError] = useState(false);

  useEffect(() => setInternalMobileOpen(mobileOpen), [mobileOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(DEFAULT_COLLAPSED_KEY, JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  const username = user?.username || user?.name || user?.email?.split('@')[0] || "Akashjainyat";
  const userRole = role || user?.role || "User";
  const avatarUrl = user?.avatarUrl || user?.avatar || user?.profile_picture;
  const initial = (username.charAt(0) || "A").toUpperCase();

  const menus = useMemo(() => buildMenu(role, notificationsCount), [role, notificationsCount]);

  const filteredMenus = useMemo(
    () =>
      menus.map((group) => ({
        ...group,
        items: group.items.filter((it) =>
          query.trim() === ""
            ? true
            : it.label.toLowerCase().includes(query.toLowerCase())
        ),
      })),
    [menus, query]
  );

  const navigate  = useNavigate();
  const location  = useLocation();

  const handleNav = useCallback(
    (route) => {
      onNavigate(route);
      navigate(route);
      setInternalMobileOpen(false);
      onMobileClose();
      document.body.style.overflow = "auto";
    },
    [navigate, onNavigate, onMobileClose]
  );

  const isActive = useCallback(
    (route) => {
      if (!route) return false;
      return location.pathname === route || location.pathname.startsWith(route + "/");
    },
    [location.pathname]
  );

  return (
    <>
      {/* ── MOBILE DRAWER ── */}
      <div
        className={`fixed inset-0 z-[9999] flex md:hidden transition-all duration-300 ease-in-out ${
          internalMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!internalMobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 ${
            internalMobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => { setInternalMobileOpen(false); onMobileClose(); document.body.style.overflow = "auto"; }}
        />

        <aside
          className={`relative w-80 max-w-[85vw] h-full bg-gradient-to-b from-[#090e17] via-[#070c14] to-[#04080e] border-r border-white/10 text-white p-5 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            internalMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* User Row Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  onError={() => setImgError(true)}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/40 flex-shrink-0 shadow-lg"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-lg ring-2 ring-emerald-500/40 flex-shrink-0">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-sm truncate tracking-tight">{username}</div>
                <div className="text-[11px] text-emerald-400 font-medium capitalize flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  {userRole}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => { setInternalMobileOpen(false); onMobileClose(); document.body.style.overflow = "auto"; }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
              aria-label="Close menu"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Navigation Scroll Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <nav aria-label="Mobile navigation">
              {filteredMenus.map((group) => (
                <div key={group.id} className="mb-5">
                  <div className="uppercase text-[10px] font-bold text-slate-400 mb-2.5 tracking-wider px-2 flex items-center gap-1.5">
                    <span>{group.label}</span>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const active = isActive(item.route);
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleNav(item.route)}
                            className={`relative flex items-center gap-3 w-full px-3.5 py-3 rounded-xl transition-all duration-200 text-left group ${
                              active
                                ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-300 font-bold shadow-md"
                                : "hover:bg-white/[0.04] text-slate-300 hover:text-white"
                            }`}
                          >
                            {/* Stripe style active indicator */}
                            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />}
                            
                            <span className={`text-lg flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${active ? "text-emerald-400" : "text-slate-400"}`}>
                              {item.icon}
                            </span>
                            <span className="flex-1 text-xs transition-colors duration-200">{item.label}</span>
                            {item.badge ? (
                              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm">
                                {item.badge}
                              </span>
                            ) : null}
                          </button>

                          {/* Context-aware sub-items on mobile */}
                          {active && item.subItems && (
                            <ul className="pl-9 pr-2 py-1.5 space-y-1 my-1 border-l-2 border-emerald-500/20 ml-4">
                              {item.subItems.map(sub => (
                                <li key={sub.id}>
                                  <button
                                    onClick={() => handleNav(sub.route)}
                                    className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-emerald-300 transition-colors"
                                  >
                                    <span className="text-emerald-400 text-xs">{sub.icon}</span>
                                    <span>{sub.label}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* 2. Financial Ticker Widget at Bottom */}
          <div className="pt-3 border-t border-white/10 mt-2">
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between shadow-inner">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <FiActivity className="text-emerald-400 animate-pulse" size={12} />
                  USD / INR FX Rate
                </div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">₹85.42 <span className="text-[10px] text-emerald-400 font-sans font-normal">+0.14%</span></div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                MARKET OPEN
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`hidden md:flex md:flex-col h-screen transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } bg-gradient-to-b from-[#090e17] via-[#070c14] to-[#04080e] backdrop-blur-2xl border-r border-white/10 text-white shadow-2xl z-40 relative`}
        aria-label="Sidebar"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FiMenu size={16} /> : <FiX size={16} />}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <FiTrendingUp size={16} className="text-white" />
              </div>
              <h1 className="font-extrabold text-lg text-white tracking-tight">FinTrack</h1>
            </div>
          )}
        </div>

        {/* Desktop Nav */}
        <nav
          className="px-3 space-y-4 overflow-y-auto custom-scrollbar flex-1 pt-4"
          aria-label="Main navigation"
        >
          {filteredMenus.map((group) => (
            <div key={group.id}>
              {!collapsed && (
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider px-2">
                  {group.label}
                </div>
              )}
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active = isActive(item.route);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNav(item.route)}
                        className={`group relative flex items-center gap-3.5 w-full px-3 py-3 rounded-xl transition-all duration-200 ${
                          active
                            ? "bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/30 text-emerald-300 font-bold shadow-md"
                            : "hover:bg-white/[0.04] text-slate-300 hover:text-white"
                        }`}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                      >
                        {/* 3. Stripe style active indicator */}
                        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />}

                        <span className={`text-lg flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                          active ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                        }`}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <span className="text-xs flex-1 text-left transition-colors duration-200">{item.label}</span>
                        )}
                        {!collapsed && item.badge ? (
                          <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>

                      {/* 6. Context-aware sub-items on desktop */}
                      {!collapsed && active && item.subItems && (
                        <ul className="pl-9 pr-2 py-1.5 space-y-1 my-1 border-l-2 border-emerald-500/30 ml-4">
                          {item.subItems.map(sub => (
                            <li key={sub.id}>
                              <button
                                onClick={() => handleNav(sub.route)}
                                className="flex items-center gap-2 w-full px-2 py-1 text-[11px] text-slate-400 hover:text-emerald-300 transition-colors"
                              >
                                <span className="text-emerald-400 text-xs">{sub.icon}</span>
                                <span>{sub.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* 2. Financial Ticker Widget at Bottom */}
        {!collapsed && (
          <div className="p-3 border-t border-white/10 m-3 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <FiActivity className="text-emerald-400 animate-pulse" size={12} />
                USD / INR
              </span>
              <span className="text-emerald-400 font-bold font-mono">₹85.42</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-slate-500">Market Status</span>
              <span className="text-[9px] text-emerald-300 font-bold uppercase">OPEN 🟢</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}