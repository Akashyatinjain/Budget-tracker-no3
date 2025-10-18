import React, { useState } from "react";
import {
  FiHome,
  FiBarChart2,
  FiDollarSign,
  FiBell,
  FiSettings,
  FiX,
  FiFileText,
  FiUsers,
  FiBookOpen,
  FiLogOut,
  FiTrendingUp,
  FiRepeat,
  FiGlobe,
  FiClock,
  FiSearch,
  FiMenu,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// Menu structure function
const menuStructure = (role) => [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <FiHome />, route: "/dashboard" },
      { id: "analytics", label: "Analytics", icon: <FiBarChart2 />, route: "/analytics" },
      { id: "trends", label: "Trends", icon: <FiTrendingUp />, route: "/trends" },
    ],
  },
  {
    id: "money",
    label: "Money",
    items: [
      { id: "transactions", label: "Transactions", icon: <FiDollarSign />, route: "/transactions" },
      { id: "budgets", label: "Budgets", icon: <FiRepeat />, route: "/budgets" },
      { id: "subscriptions", label: "Subscriptions", icon: <FiClock />, route: "/subscriptions" },
      { id: "currencies", label: "Currencies", icon: <FiGlobe />, route: "/currencies" },
    ],
  },
  {
    id: "reports",
    label: "Reports & Admin",
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
      { id: "notifications", label: "Notifications", icon: <FiBell />, route: "/notifications" },
      { id: "settings", label: "Settings", icon: <FiSettings />, route: "/settings" },
      { id: "help", label: "Help", icon: <FiBookOpen />, route: "/help" },
    ],
  },
];

export default function AdvancedSidebar({
  user = { username: "Guest", avatarUrl: "" },
  role = "user",
  collapsed: collapsedProp = false,
  onNavigate = (r) => console.log("navigate", r),
  notificationsCount = 3,
  mobileOpen = false,
  onMobileClose = () => {},
}) {
  const [collapsed, setCollapsed] = useState(collapsedProp);
  const [query, setQuery] = useState("");
  const avatar = user?.avatarUrl || "/default-avatar.png";
  const username = user?.username || "Guest";

  const menus = menuStructure(role);
  const filteredMenus = menus.map((group) => ({
    ...group,
    items: group.items.filter((it) =>
      query.trim() === "" ? true : it.label.toLowerCase().includes(query.toLowerCase())
    ),
  }));

  const navigate = useNavigate();
  const handleNav = (route) => {
    navigate(route);
    onMobileClose();
    document.body.style.overflow = "auto";
  };

  return (
    <>
      {/* MOBILE Drawer */}
      <div
        className={`fixed inset-0 z-[9999] flex md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onMobileClose}
        />
        {/* Drawer */}
        <aside className="relative w-72 h-full bg-gradient-to-b from-black via-[#1b0128] to-[#2e014d] text-white p-4 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt={username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-white">{username}</div>
                <div className="text-xs text-purple-300 capitalize">{role}</div>
              </div>
            </div>
            <button
              onClick={onMobileClose}
              className="p-2 rounded-md hover:bg-purple-600/40 transition"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-purple-950/40 rounded-lg p-2 mb-4">
            <FiSearch className="text-purple-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent outline-none text-sm text-purple-200 placeholder-purple-400"
            />
          </div>

          {/* Menu */}
          <div className="flex-1 overflow-y-auto sidebar-scrollbar">
            <nav>
              {filteredMenus.map((group) => (
                <div key={group.id} className="mb-5">
                  <div className="uppercase text-xs text-purple-400 mb-2 tracking-wide">
                    {group.label}
                  </div>
                  <ul className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNav(item.route)}
                          className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-purple-600/30 transition-all duration-200"
                        >
                          <span className="text-lg text-purple-300 group-hover:text-white">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* MOBILE Footer */}
          <div className="mt-4 border-t border-purple-900/40 pt-4 flex flex-col gap-2">
            <button
              onClick={() => handleNav("/settings")}
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-purple-600/30"
            >
              <FiSettings /> <span>Settings</span>
            </button>
            <button
              onClick={() => handleNav("/logout")}
              className="w-full flex items-center gap-2 p-2 rounded-md bg-purple-900/40 hover:bg-red-700/50 text-red-400 hover:text-white transition-all"
            >
              <FiLogOut /> <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>

      {/* DESKTOP Sidebar */}
      <aside
        className={`hidden md:flex md:flex-col h-screen transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } bg-gradient-to-b from-black via-[#1b0128] to-[#2e014d] text-white border-r border-purple-900/40`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-2 rounded-md hover:bg-purple-600/30"
          >
            {collapsed ? <FiMenu /> : <FiX />}
          </button>
          {!collapsed && <h1 className="font-semibold text-xl text-purple-400">Finance Pro</h1>}
        </div>

        {/* Search */}
        <div className="px-3">
          <div className="flex items-center gap-2 bg-purple-950/50 rounded-lg p-2 mb-4">
            <FiSearch />
            {!collapsed && (
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm text-purple-200"
              />
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="px-2 space-y-5 overflow-y-auto sidebar-scrollbar">
          {filteredMenus.map((group) => (
            <div key={group.id}>
              {!collapsed && (
                <div className="text-xs uppercase text-purple-400 mb-2 tracking-widest">
                  {group.label}
                </div>
              )}
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNav(item.route)}
                      className="group flex items-center gap-3 w-full p-2 rounded-md hover:bg-purple-600/30 transition-all duration-200"
                    >
                      <span className="text-lg text-purple-300 group-hover:text-purple-100">
                        {item.icon}
                      </span>
                      {!collapsed && <span className="text-sm group-hover:text-white">{item.label}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* DESKTOP Footer */}
        <div className="mt-auto border-t border-purple-900/40 p-4 flex flex-col gap-2">
          <button
            onClick={() => handleNav("/settings")}
            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-purple-600/30"
          >
            <FiSettings /> {!collapsed && <span>Settings</span>}
          </button>
          <button
            onClick={() => handleNav("/logout")}
            className="w-full flex items-center gap-2 p-2 rounded-md bg-purple-900/40 hover:bg-red-700/50 text-red-400 hover:text-white transition-all"
          >
            <FiLogOut /> {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
