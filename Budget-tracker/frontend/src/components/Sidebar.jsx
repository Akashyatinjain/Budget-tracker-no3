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
      { id: "reports", label: "Reports", icon: <FiFileText />, route: "/reports" },
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
      { id: "settings", label: "Settings", icon: <FiSettings />, route: "/settings" },
    ],
  },
];

export default function AdvancedSidebar({
  user = { username: "Guest", avatarUrl: "" },
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

  useEffect(() => setInternalMobileOpen(mobileOpen), [mobileOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(DEFAULT_COLLAPSED_KEY, JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  const avatar   = user?.avatarUrl || "/default-avatar.png";
  const username = user?.username  || "Guest";

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
        className={`fixed inset-0 z-[9999] flex md:hidden transition-transform duration-300 ease-in-out ${
          internalMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!internalMobileOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => { setInternalMobileOpen(false); onMobileClose(); }}
        />

        {/* Drawer panel */}
        <aside className="relative w-72 h-full bg-[#0d1117] border-r border-[#213b21]/60 text-white p-4 shadow-2xl flex flex-col">
          {/* User row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={avatar} alt={username} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30" />
              <div>
                <div className="font-semibold text-white">{username}</div>
                <div className="text-xs text-emerald-400 capitalize">{role}</div>
              </div>
            </div>
            <button
              onClick={() => { setInternalMobileOpen(false); onMobileClose(); }}
              className="p-2 rounded-md hover:bg-emerald-900/40 transition"
              aria-label="Close menu"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[#161b22]/80 border border-[#213b21]/60 rounded-lg p-2 mb-4">
            <FiSearch className="text-emerald-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none text-sm text-emerald-200 placeholder-emerald-700"
              aria-label="Search menu"
            />
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto sidebar-scrollbar">
            <nav aria-label="Main navigation">
              {filteredMenus.map((group) => (
                <div key={group.id} className="mb-5">
                  <div className="uppercase text-xs text-emerald-600/70 mb-2 tracking-wide">
                    {group.label}
                  </div>
                  <ul className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNav(item.route)}
                          className={`flex items-center gap-3 w-full p-2 rounded-md transition-all duration-200 text-left ${
                            isActive(item.route)
                              ? "bg-emerald-900/40 text-emerald-300"
                              : "hover:bg-emerald-900/30 text-gray-300"
                          }`}
                          aria-current={isActive(item.route) ? "page" : undefined}
                          title={item.label}
                        >
                          <span className={`text-lg ${isActive(item.route) ? "text-emerald-400" : "text-emerald-500"}`}>
                            {item.icon}
                          </span>
                          <span className="flex-1 text-sm">{item.label}</span>
                          {item.badge ? (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`hidden md:flex md:flex-col h-screen transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } bg-[#0d1117] border-r border-[#213b21]/60 text-white`}
        aria-label="Sidebar"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-2 rounded-md hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-400 transition"
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FiMenu /> : <FiX />}
          </button>
          {!collapsed && (
            <h1 className="font-semibold text-xl text-emerald-400">Finance Pro</h1>
          )}
        </div>

        {/* Search */}
        <div className="px-3 mb-2">
          <div className="flex items-center gap-2 bg-[#161b22]/80 border border-[#213b21]/60 rounded-lg p-2">
            <FiSearch className="text-emerald-500 flex-shrink-0" />
            {!collapsed && (
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm text-emerald-200 placeholder-emerald-700"
                aria-label="Search menu"
              />
            )}
          </div>
        </div>

        {/* Nav */}
        <nav
          className="px-2 space-y-4 overflow-y-auto sidebar-scrollbar flex-1 pt-2"
          aria-label="Main navigation"
        >
          {filteredMenus.map((group) => (
            <div key={group.id}>
              {!collapsed && (
                <div className="text-xs uppercase text-emerald-600/70 mb-2 tracking-widest px-2">
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
                        className={`group flex items-center gap-3 w-full p-2 rounded-md transition-all duration-200 ${
                          active
                            ? "bg-emerald-900/40 text-emerald-300"
                            : "hover:bg-emerald-900/30 text-gray-300 hover:text-emerald-200"
                        }`}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className={`text-lg flex-shrink-0 ${
                          active ? "text-emerald-400" : "text-emerald-500 group-hover:text-emerald-300"
                        }`}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <span className="text-sm">{item.label}</span>
                        )}
                        {!collapsed && item.badge ? (
                          <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}