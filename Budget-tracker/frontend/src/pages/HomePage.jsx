import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaWallet, FaChartPie, FaBell, FaUsers, FaClock,
  FaMoneyBillWave, FaArrowRight, FaShieldAlt, FaChartLine,
  FaExchangeAlt, FaFileAlt, FaCheckCircle, FaLock, FaChevronDown,
  FaCalculator, FaRegStar, FaCreditCard, FaSlidersH
} from "react-icons/fa";
import { FiSun, FiMoon, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Particles from "../components/Particles.jsx";
import { applyTheme } from "../App.jsx";
import toast from "react-hot-toast";

const websiteFeatures = [
  {
    id: "transactions",
    icon: <FaWallet className="text-4xl" />,
    title: "Smart Expense & Income Tracker",
    short: "Log, search, and automatically categorize all financial flows.",
    description: "Keep complete control over your cashflow with automated categorization, custom tag filters, and instant transaction search.",
    benefits: ["Instant categorization", "Multi-tag filtering", "Custom date ranges"],
    color: "emerald"
  },
  {
    id: "budgets",
    icon: <FaChartPie className="text-4xl" />,
    title: "Precision Budget Planner",
    short: "Set category spending caps and receive automated overflow alerts.",
    description: "Prevent overspending with real-time budget progress indicators, category allowances, and smart threshold warnings before you cross your limits.",
    benefits: ["Category-specific limits", "Live progress bars", "Predictive threshold alerts"],
    color: "teal"
  },
  {
    id: "analytics",
    icon: <FaChartLine className="text-4xl" />,
    title: "Visual Analytics & Trends",
    short: "In-depth graphs, category breakdowns, and growth projections.",
    description: "Turn raw data into actionable intelligence with interactive visual pie charts, spending distribution graphs, and multi-month trend analysis.",
    benefits: ["Visual charts & graphs", "Income vs expense breakdown", "Future cashflow trends"],
    color: "indigo"
  },
  {
    id: "subscriptions",
    icon: <FaCreditCard className="text-4xl" />,
    title: "Subscription & Bill Manager",
    short: "Track recurring payments, renewal countdowns, and fixed costs.",
    description: "Never get surprised by auto-renewals again. Track Netflix, AWS, software licenses, and utility bills in one central dashboard.",
    benefits: ["Renewal countdowns", "Unused service detection", "Monthly fixed burn calculation"],
    color: "purple"
  },
  {
    id: "currencies",
    icon: <FaExchangeAlt className="text-4xl" />,
    title: "Multi-Currency & Exchange Rates",
    short: "Live currency conversion for global accounts & forex tracking.",
    description: "Manage foreign investments, international income streams, and currency exchange rates seamlessly with real-time conversion tools.",
    benefits: ["Live conversion rates", "Multi-currency portfolios", "FX gain/loss tracking"],
    color: "amber"
  },
  {
    id: "reports",
    icon: <FaFileAlt className="text-4xl" />,
    title: "One-Click PDF/CSV Financial Reports",
    short: "Generate tax-ready summaries and accounting export sheets.",
    description: "Download professional, audited financial statements and tax-ready summaries instantly in PDF or Excel/CSV formats.",
    benefits: ["Tax-ready summaries", "Clean PDF export", "Complete CSV data dumps"],
    color: "sky"
  }
];

const stats = [
  { value: "25,000+", label: "Active Professionals" },
  { value: "₹285 Cr+", label: "Transactions Tracked" },
  { value: "99.9%", label: "System Uptime" },
  { value: "4.9/5", label: "User Satisfaction" },
];

const faqItems = [
  {
    q: "How does FinTrack help me control my monthly expenses?",
    a: "FinTrack lets you set strict budget caps per category (e.g., Dining, Shopping, Bills). You get real-time visual progress bars and instant notifications when you reach 80% or 100% of your allowance."
  },
  {
    q: "Can I manage recurring subscriptions and bill payments?",
    a: "Yes! Our built-in Subscription Manager tracks renewal dates, cost frequencies, and total monthly recurring expenses so you never miss a bill or pay for forgotten services."
  },
  {
    q: "Is my financial data secure on FinTrack?",
    a: "Absolutely. We utilize bank-grade 256-bit AES encryption, multi-factor authentication, and strict privacy protocols. Your data is strictly yours and is never sold to third parties."
  },
  {
    q: "Can I export my data for tax filing or accounting?",
    a: "Yes. You can generate comprehensive PDF reports or export clean CSV sheets anytime with a single click from the Reports dashboard."
  },
  {
    q: "Does FinTrack support multiple currencies?",
    a: "Yes, FinTrack features an integrated live currency converter supporting INR, USD, EUR, GBP, and more for global professionals."
  }
];

const testimonials = [
  {
    quote: "FinTrack completely transformed how I manage my personal and business cashflow. The budget warnings alone saved me ₹30,000 last month!",
    name: "Priya Sharma",
    role: "Chartered Accountant",
    avatar: "👩🏻‍💼"
  },
  {
    quote: "Best financial dashboard for professionals in India. The subscription manager and multi-currency tools are clean, fast, and indispensable.",
    name: "Rahul Mehra",
    role: "Tech Entrepreneur",
    avatar: "👨🏻‍💻"
  },
  {
    quote: "Finally an app that combines expense tracking, visual analytics, and tax reporting without any clutter. 10/10 recommendation!",
    name: "Ananya Rao",
    role: "Investment Analyst",
    avatar: "👩🏽‍💼"
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeDemoTab, setActiveDemoTab] = useState("overview");
  const [openFaq, setOpenFaq] = useState(null);
  
  // Interactive Calculator State
  const [monthlySavings, setMonthlySavings] = useState(25000);
  const [savingsYears, setSavingsYears] = useState(10);
  const expectedReturnRate = 0.12; // 12% annual estimated return

  const [currentTheme, setCurrentTheme] = useState(
    () => localStorage.getItem("fintrack_theme") || "dark"
  );
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
    toast.success(`Switched to ${nextTheme === "light" ? "Light Mode" : "Dark Mode"}`);
  };

  // Wealth calculation
  const totalMonths = savingsYears * 12;
  const totalInvested = monthlySavings * totalMonths;
  const futureWealth = Math.round(
    monthlySavings * ((Math.pow(1 + expectedReturnRate / 12, totalMonths) - 1) / (expectedReturnRate / 12))
  );
  const wealthGained = futureWealth - totalInvested;

  return (
    <div className="bg-[#0A0F1C] text-white min-h-screen overflow-x-hidden font-sans">
      {/* Dynamic Particles Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Particles
          particleColors={currentTheme === "light" ? ["#059669", "#475569", "#0284c7"] : ["#10b981", "#64748b", "#0ea5e9"]}
          particleCount={80}
          speed={0.08}
          particleBaseSize={60}
          alphaParticles={true}
        />
      </div>

      {/* Professional Sticky Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F1C]/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-emerald-500/20">
              ₹
            </div>
            <span className="text-2xl font-bold tracking-tight">FinTrack</span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#demo" className="hover:text-emerald-400 transition-colors">Live Demo</a>
            <a href="#calculator" className="hover:text-emerald-400 transition-colors">Wealth Calculator</a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">Security</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleTheme}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all flex items-center justify-center shadow-sm"
              title={currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {currentTheme === "dark" ? (
                <FiSun className="text-xl text-amber-400 animate-spin-slow" />
              ) : (
                <FiMoon className="text-xl text-indigo-400" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => navigate("/sign-in")}
              className="hidden sm:block px-6 py-2.5 text-sm font-medium rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            >
              Log in
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/sign-up")}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold rounded-2xl transition-all duration-200 text-white shadow-lg shadow-emerald-600/25"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </nav>

      {/* 🚀 Hero Section */}
      <section className="pt-36 pb-20 relative z-10">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-medium px-4 py-2 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              The Complete Financial Management Suite for India
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
              Take complete control of your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Financial Future</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-xl leading-relaxed">
              Track expenses, automate category budgets, monitor subscriptions, and analyze long-term financial trends with bank-grade precision.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/sign-up")}
                className="px-9 py-4 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-2xl flex items-center gap-3 text-base sm:text-lg transition-all text-white shadow-xl shadow-emerald-600/30"
              >
                Start Your Free Trial
                <FaArrowRight className="text-sm" />
              </motion.button>

              <button
                onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border border-white/20 hover:border-emerald-500/50 hover:bg-white/5 rounded-2xl font-medium text-base sm:text-lg transition-all"
              >
                Explore Live Features
              </button>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center gap-8 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> No credit card required</div>
              <div className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> 14-day full access</div>
              <div className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400" /> Instant Setup</div>
            </div>
          </div>

          {/* 🖥️ Interactive Live Dashboard Feature Showcase */}
          <motion.div
            id="demo"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="bg-[#111827] border border-gray-700/80 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
              {/* Tab Header Bar */}
              <div className="bg-[#0F172A] px-4 py-3 flex items-center justify-between border-b border-gray-700/80 overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-2">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "transactions", label: "Transactions" },
                    { id: "budgets", label: "Budgets" },
                    { id: "subscriptions", label: "Subscriptions" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDemoTab(tab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeDemoTab === tab.id
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-emerald-400 font-mono hidden sm:block px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  Live Preview
                </span>
              </div>

              {/* Dynamic Showcase Content */}
              <div className="p-6 sm:p-8 space-y-6">
                {activeDemoTab === "overview" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-gray-400 text-xs tracking-wider uppercase font-medium">Net Financial Worth</p>
                        <p className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-1 text-white">₹68,42,750</p>
                        <p className="text-emerald-400 text-xs sm:text-sm font-semibold mt-1 flex items-center gap-1">
                          ▲ +₹4,28,390 (+6.7%) this month
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">March 2026</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3.5">
                      <div className="bg-[#1F2937]/90 rounded-2xl p-4 border border-white/5">
                        <p className="text-xs text-gray-400">Total Income</p>
                        <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">₹2,84,000</p>
                      </div>
                      <div className="bg-[#1F2937]/90 rounded-2xl p-4 border border-white/5">
                        <p className="text-xs text-gray-400">Total Expenses</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-400 mt-1">₹1,67,450</p>
                      </div>
                      <div className="bg-[#1F2937]/90 rounded-2xl p-4 border border-white/5">
                        <p className="text-xs text-gray-400">Net Savings</p>
                        <p className="text-xl sm:text-2xl font-bold text-sky-400 mt-1">₹1,16,550</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeDemoTab === "transactions" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold text-gray-300">Recent Cashflow Activity</h4>
                      <span className="text-xs text-emerald-400 font-medium">Auto-Categorized</span>
                    </div>
                    {[
                      { name: "Salary Credit - TechCorp India", category: "Income", amount: "+₹1,45,000", type: "in", date: "Today, 10:30 AM" },
                      { name: "Reliance Fresh Supermarket", category: "Groceries", amount: "-₹4,850", type: "out", date: "Yesterday" },
                      { name: "Zerodha Mutual Fund SIP", category: "Investment", amount: "-₹25,000", type: "out", date: "28 Mar 2026" },
                    ].map((tx, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-[#1F2937]/80 rounded-xl border border-white/5">
                        <div>
                          <p className="text-xs font-semibold text-white">{tx.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{tx.category} • {tx.date}</p>
                        </div>
                        <span className={`text-xs font-bold ${tx.type === "in" ? "text-emerald-400" : "text-gray-300"}`}>
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeDemoTab === "budgets" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold text-gray-300">Category Budget Controls</h4>
                      <span className="text-xs text-orange-400 font-medium">2 Active Alerts</span>
                    </div>
                    {[
                      { category: "Food & Dining", spent: "₹17,600", limit: "₹20,000", percent: 88, color: "bg-orange-500" },
                      { category: "Shopping & Lifestyle", spent: "₹12,400", limit: "₹15,000", percent: 82, color: "bg-amber-500" },
                      { category: "Utilities & Bills", spent: "₹8,200", limit: "₹12,000", percent: 68, color: "bg-emerald-500" },
                    ].map((b, idx) => (
                      <div key={idx} className="p-3.5 bg-[#1F2937]/80 rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-white">{b.category}</span>
                          <span className="text-gray-400">{b.spent} / {b.limit} ({b.percent}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeDemoTab === "subscriptions" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-semibold text-gray-300">Active Recurring Subscriptions</h4>
                      <span className="text-xs text-purple-400 font-medium">₹4,290 / mo</span>
                    </div>
                    {[
                      { title: "Netflix Premium 4K", cost: "₹649 / mo", due: "Renews in 3 days", status: "Active" },
                      { title: "Amazon Web Services (AWS)", cost: "₹2,840 / mo", due: "Renews on Apr 5", status: "Active" },
                      { title: "Spotify Family Duo", cost: "₹179 / mo", due: "Renews on Apr 12", status: "Active" },
                    ].map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-[#1F2937]/80 rounded-xl border border-white/5">
                        <div>
                          <p className="text-xs font-semibold text-white">{sub.title}</p>
                          <p className="text-[11px] text-emerald-400 mt-0.5">{sub.due}</p>
                        </div>
                        <span className="text-xs font-bold text-white">{sub.cost}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-4 -right-4 bg-[#111827] border border-emerald-500/40 text-emerald-400 text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 font-semibold">
              <FaChartLine /> Verified Financial Engine
            </div>
          </motion.div>
        </div>
      </section>

      {/* 📊 High Impact Stats Bar */}
      <section className="py-16 bg-black/40 border-y border-white/5 relative z-10">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">{stat.value}</div>
                <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🛠️ Comprehensive Website Features Section */}
      <section id="features" className="py-28 relative z-10">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Master Money</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Explore the full suite of modules built specifically for individuals, professionals, and wealth builders.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {websiteFeatures.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-[#111827] border border-gray-700/80 hover:border-emerald-500/50 rounded-3xl p-8 transition-all duration-300 group flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/20"
              >
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">{feature.description}</p>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-2.5">
                  {feature.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-300 font-medium">
                      <FiCheck className="text-emerald-400 text-sm flex-shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🧮 Interactive Wealth Growth Calculator Widget */}
      <section id="calculator" className="py-24 bg-gradient-to-b from-black/60 to-[#0A0F1C] border-y border-white/5 relative z-10">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-2 rounded-full">
                <FaCalculator /> Interactive Forecast Engine
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                See how smart budgeting accelerates your <span className="text-emerald-400">Wealth Growth</span>
              </h2>
              <p className="text-gray-400 text-base leading-relaxed">
                By tracking daily leakages and staying under budget, consistent monthly savings compounded over time generate life-changing wealth.
              </p>
              <div className="p-5 bg-[#111827] border border-gray-700/80 rounded-2xl space-y-3 text-xs text-gray-300">
                <div className="flex items-center gap-2 font-semibold text-emerald-400">
                  <FaRegStar /> Based on standard compound annual returns (12% p.a.)
                </div>
                <p>Use FinTrack to identify unnecessary spending and redirect savings straight into growth.</p>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#111827] border border-gray-700/80 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-gray-300">Monthly Savings Target</span>
                    <span className="text-emerald-400 font-mono text-base">₹{monthlySavings.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="100000"
                    step="1000"
                    value={monthlySavings}
                    onChange={(e) => setMonthlySavings(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-2 bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-gray-300">Time Horizon (Years)</span>
                    <span className="text-emerald-400 font-mono text-base">{savingsYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={savingsYears}
                    onChange={(e) => setSavingsYears(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-2 bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-white/10 text-center">
                <div className="p-4 bg-[#1F2937]/80 rounded-2xl border border-white/5">
                  <p className="text-xs text-gray-400">Total Invested</p>
                  <p className="text-xl font-bold text-white mt-1">₹{totalInvested.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-[#1F2937]/80 rounded-2xl border border-white/5">
                  <p className="text-xs text-gray-400">Estimated Returns</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">₹{wealthGained.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl">
                  <p className="text-xs text-emerald-300 font-semibold">Total Wealth</p>
                  <p className="text-2xl font-extrabold text-emerald-400 mt-1">₹{futureWealth.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🗺️ How It Works Roadmap */}
      <section className="py-28 relative z-10">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 text-center space-y-16">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">How FinTrack Works</h2>
            <p className="text-gray-400 text-lg">Three simple steps to financial clarity and control.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { step: "01", title: "Setup & Log Transactions", desc: "Easily log income, expenses, and recurring bills with intuitive multi-category tags." },
              { step: "02", title: "Set Smart Budget Limits", desc: "Define monthly allowances for food, shopping, and bills. Get instant threshold alerts." },
              { step: "03", title: "Watch Your Wealth Compound", desc: "Analyze visual trends, export tax reports, and optimize your cashflow effortlessly." },
            ].map((s, idx) => (
              <div key={idx} className="bg-[#111827] border border-gray-700/80 rounded-3xl p-8 relative overflow-hidden group">
                <span className="text-6xl font-black text-white/5 absolute top-4 right-6 group-hover:text-emerald-500/10 transition-colors">{s.step}</span>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg mb-6">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔒 Security Spotlight */}
      <section id="security" className="py-24 bg-black/40 border-y border-white/5 relative z-10">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-12 text-center space-y-12">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full">
              <FaLock /> Bank-Grade Security Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Your Security & Privacy is Our Top Priority</h2>
            <p className="text-gray-400 text-base">We safeguard your sensitive financial data with enterprise encryption protocols.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-[#111827] p-6 rounded-2xl border border-gray-700/80 space-y-3">
              <FaShieldAlt className="text-3xl text-emerald-400" />
              <h4 className="text-lg font-bold text-white">256-Bit AES Encryption</h4>
              <p className="text-xs text-gray-400 leading-relaxed">All data in transit and at rest is protected with high-grade cryptographic standards.</p>
            </div>
            <div className="bg-[#111827] p-6 rounded-2xl border border-gray-700/80 space-y-3">
              <FaLock className="text-3xl text-teal-400" />
              <h4 className="text-lg font-bold text-white">Strict Data Privacy</h4>
              <p className="text-xs text-gray-400 leading-relaxed">We strictly adhere to privacy guidelines. Your financial data is never rented or sold.</p>
            </div>
            <div className="bg-[#111827] p-6 rounded-2xl border border-gray-700/80 space-y-3">
              <FaCheckCircle className="text-3xl text-cyan-400" />
              <h4 className="text-lg font-bold text-white">Automated Cloud Backups</h4>
              <p className="text-xs text-gray-400 leading-relaxed">Continuous cloud snapshots ensure your records are backed up and instantly accessible.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 💬 Testimonials */}
      <section id="insights" className="py-28 relative z-10">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Loved by Finance Professionals</h2>

          <div className="relative min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#111827] border border-gray-700/80 rounded-3xl p-8 sm:p-12 shadow-2xl"
              >
                <p className="text-xl sm:text-2xl leading-relaxed text-gray-200 italic font-light">
                  “{testimonials[currentTestimonial].quote}”
                </p>
                <div className="mt-8 flex items-center gap-4 justify-center">
                  <span className="text-4xl">{testimonials[currentTestimonial].avatar}</span>
                  <div className="text-left">
                    <div className="font-bold text-white text-base">{testimonials[currentTestimonial].name}</div>
                    <div className="text-emerald-400 text-xs font-semibold">{testimonials[currentTestimonial].role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ❓ Frequently Asked Questions Accordion */}
      <section id="faq" className="py-28 bg-black/40 border-t border-white/5 relative z-10">
        <div className="max-w-screen-md mx-auto px-6 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-base">Have questions about FinTrack? We've got answers.</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="bg-[#111827] border border-gray-700/80 rounded-2xl overflow-hidden transition-colors">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center text-white font-semibold text-base sm:text-lg hover:text-emerald-400 transition-colors"
                >
                  <span>{item.q}</span>
                  <FaChevronDown className={`text-sm text-gray-400 transition-transform duration-300 flex-shrink-0 ml-4 ${openFaq === idx ? "rotate-180 text-emerald-400" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🎯 Final CTA Banner */}
      <section className="py-28 border-t border-white/5 relative z-10 bg-gradient-to-b from-[#0A0F1C] to-black">
        <div className="max-w-3xl mx-auto text-center px-6 space-y-8">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
            Start building your financial freedom today
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto">
            Join thousands of smart professionals tracking their cashflow, budgets, and investments with FinTrack.
          </p>

          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/sign-up")}
              className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-lg font-bold rounded-2xl inline-flex items-center gap-3 transition-all text-white shadow-2xl shadow-emerald-600/40"
            >
              Create Professional Account
              <FaArrowRight />
            </motion.button>
          </div>
        </div>
      </section>

      {/* 🌐 Comprehensive Footer */}
      <footer className="bg-black py-20 border-t border-white/10 text-gray-400 relative z-10 text-sm">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          <div className="md:col-span-2 space-y-4 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold text-white">
                ₹
              </div>
              <span className="text-2xl font-bold text-white">FinTrack</span>
            </div>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              India's leading finance management platform designed for professionals seeking clarity, control, and actionable wealth growth.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> All Systems Operational
            </div>
          </div>

          <div className="space-y-3 text-left">
            <h5 className="text-white font-bold text-base">Features</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Expense Tracking</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Budget Planner</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Subscription Manager</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Multi-Currency</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Tax & PDF Reports</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <h5 className="text-white font-bold text-base">Platform</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a></li>
              <li><a href="#calculator" className="hover:text-white transition-colors">Wealth Calculator</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security Architecture</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-left">
            <h5 className="text-white font-bold text-base">Account</h5>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigate("/sign-in")} className="hover:text-white transition-colors">Sign In</button></li>
              <li><button onClick={() => navigate("/sign-up")} className="hover:text-white transition-colors">Create Free Account</button></li>
              <li><button onClick={() => navigate("/sign-in")} className="hover:text-white transition-colors">Forgot Password</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p>© 2026 FinTrack Inc. Professional Finance Management. All rights reserved.</p>
          <div className="flex gap-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}