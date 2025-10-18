import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBell, FaUserCircle } from "react-icons/fa";
import { FiMenu } from "react-icons/fi";
import logo from "../assets/logo.svg";

const Header = ({ onMobileToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsSignedIn(true);
      setUsername("John Dice"); // Replace with dynamic user name from API if needed
    } else {
      setIsSignedIn(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsSignedIn(false);
    setTimeout(() => navigate("/sign-in"), 500);
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
      case "/app":
      case "/app/dashboard":
        return "Dashboard";
      case "/app/transactions":
        return "Transactions";
      case "/app/subscriptions":
        return "Subscriptions";
      case "/app/reports":
        return "Reports";
      case "/app/account":
        return "Account";
      default:
        return "";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-purple-700/20 text-white shadow-sm">
      
      {/* LEFT: Mobile Menu + Logo + Title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onMobileToggle}
          className="md:hidden text-xl text-gray-300 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-all duration-200"
        >
          <FiMenu />
        </button>

        {/* Logo + Brand */}
        <Link to="/app/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gray-900 border-2 border-purple-500 flex items-center justify-center shadow-lg">
            <img src={logo} alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-lg font-semibold hidden sm:block">BudgetTracker</span>
        </Link>

        {/* Page Title (Tablet + Desktop) */}
        <div className="hidden md:block ml-4 pl-4 border-l border-gray-800">
          <h1 className="text-base font-medium text-purple-300">{getPageTitle()}</h1>
        </div>
      </div>

      {/* RIGHT: User Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200">
          <FaBell className="text-lg" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Info */}
        {isSignedIn ? (
          <>
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm font-medium">{username}</span>
                <span className="text-xs text-gray-400">Premium User</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md bg-gray-800 text-sm text-white font-medium hover:bg-gray-700 transition-all duration-200"
              >
                <FaSignOutAlt className="inline-block mr-1 text-xs" /> Logout
              </button>
            </div>

            {/* Mobile */}
            <Link
              to="/app/account"
              className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-indigo-700 flex items-center justify-center hover:ring-2 hover:ring-purple-500/50 transition-all md:hidden"
            >
              <FaUserCircle className="text-white text-lg" />
            </Link>
          </>
        ) : (
          // Not signed in
          <div className="flex items-center gap-2">
            <Link
              to="/sign-in"
              className="px-3 py-1.5 rounded-md bg-gray-800 text-white text-sm hover:bg-gray-700 transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
