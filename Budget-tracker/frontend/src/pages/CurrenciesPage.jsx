// CurrenciesPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  fetchCurrencies,
  addCurrency,
  setDefaultCurrency,
  deleteCurrency,
} from "../store/currencySlice";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  DollarSign,
  Globe,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  Star,
  Trash2,
  CheckCircle,
  Sparkles,
  ArrowRightLeft,
  Table,
  ChevronRight
} from "lucide-react";

const CurrenciesPage = () => {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const { items: rawCurrencies, loading: reduxLoading } = useSelector((state) => state.currencies);
  const [currencies, setCurrencies] = useState([]);
  const [userCurrency, setUserCurrency] = useState("INR");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [converter, setConverter] = useState({
    amount: "1000",
    fromCurrency: "INR",
    toCurrency: "USD",
  });
  const [convertedAmount, setConvertedAmount] = useState("");

  const [newCurrency, setNewCurrency] = useState({
    code: "",
    name: "",
    rate_to_inr: "",
    is_default: false,
  });

  const popularCurrencies = [
    { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", rate_to_inr: 1 },
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", rate_to_inr: 0.012 },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", rate_to_inr: 0.011 },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", rate_to_inr: 0.0095 },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", rate_to_inr: 1.78 },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦", rate_to_inr: 0.016 },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", rate_to_inr: 0.018 },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", rate_to_inr: 0.086 },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", rate_to_inr: 0.016 },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", rate_to_inr: 0.044 },
  ];

  const safeNumber = (v, fallback = NaN) => {
    if (v === null || v === undefined || v === "") return fallback;
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : fallback;
  };

  const getCurrencySymbol = (code) => {
    const found = popularCurrencies.find((c) => c.code === code);
    return found ? found.symbol : code;
  };

  const getCurrencyFlag = (code) => {
    const found = popularCurrencies.find((c) => c.code === code);
    return found ? found.flag : "🏳️";
  };

  useEffect(() => {
    document.body.style.overflow =
      mobileSidebarOpen || showAddCurrency ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen, showAddCurrency]);

  useEffect(() => {
    document.title = "Currencies | FinTrack Budget Tracker";
    if (token) {
      dispatch(fetchCurrencies());
    }
  }, [token, dispatch]);

  useEffect(() => {
    calculateConversion();
  }, [converter.amount, converter.fromCurrency, converter.toCurrency, currencies]);

  const initializeDefaultCurrencies = async () => {
    try {
      for (const currency of popularCurrencies) {
        await dispatch(addCurrency({
          code: currency.code,
          name: currency.name,
          rate_to_inr: currency.rate_to_inr,
          is_default: currency.code === "INR",
        })).unwrap();
      }
      dispatch(fetchCurrencies());
    } catch (err) {
      console.error("Initialize currencies error:", err);
    }
  };

  useEffect(() => {
    if (!token) {
      setCurrencies(popularCurrencies.map((c) => ({ ...c, is_default: c.code === "INR" })));
      setUserCurrency("INR");
      setLoading(false);
      return;
    }

    if (reduxLoading && currencies.length === 0) {
      setLoading(true);
      return;
    }

    if (!reduxLoading) {
      if (rawCurrencies.length === 0) {
        initializeDefaultCurrencies();
      } else {
        setCurrencies(rawCurrencies);
        const def = rawCurrencies.find((c) => c.is_default);
        if (def) setUserCurrency(def.code);
        setLoading(false);
      }
    }
  }, [rawCurrencies, reduxLoading, token, dispatch]);

  const handleAddCurrency = async (e) => {
    e.preventDefault();
    if (!newCurrency.code || !newCurrency.name || newCurrency.rate_to_inr === "") {
      toast.error("Please fill all required fields.");
      return;
    }
    const rateNum = safeNumber(newCurrency.rate_to_inr);
    if (!isFinite(rateNum)) {
      toast.error("Invalid exchange rate value.");
      return;
    }

    try {
      await dispatch(addCurrency({
        code: newCurrency.code,
        name: newCurrency.name,
        rate_to_inr: rateNum,
        is_default: !!newCurrency.is_default,
      })).unwrap();
      toast.success("✨ Currency added successfully!");
      setShowAddCurrency(false);
      setNewCurrency({ code: "", name: "", rate_to_inr: "", is_default: false });
      dispatch(fetchCurrencies());
    } catch (err) {
      console.error("Add currency error:", err);
      toast.error("Error adding currency. Please try again.");
    }
  };

  const handleSetDefault = async (currencyCode) => {
    try {
      await dispatch(setDefaultCurrency(currencyCode)).unwrap();
      toast.success(`Default currency set to ${currencyCode}`);
      dispatch(fetchCurrencies());
    } catch (err) {
      console.error("Set default currency error:", err);
      toast.error("Error setting default currency.");
    }
  };

  const handleRemoveCurrency = async (currencyCode) => {
    if (currencyCode === userCurrency) {
      toast.error("Cannot remove your default currency.");
      return;
    }
    try {
      await dispatch(deleteCurrency(currencyCode)).unwrap();
      toast.success("Currency removed.");
      dispatch(fetchCurrencies());
    } catch (err) {
      console.error("Remove currency error:", err);
      toast.error("Error removing currency.");
    }
  };

  const calculateConversion = () => {
    const amount = safeNumber(converter.amount, NaN);
    if (!isFinite(amount) || amount <= 0) {
      setConvertedAmount("");
      return;
    }

    const fromCurrency = currencies.find((c) => c.code === converter.fromCurrency);
    const toCurrency = currencies.find((c) => c.code === converter.toCurrency);

    if (!fromCurrency || !toCurrency) {
      setConvertedAmount("N/A");
      return;
    }

    const fromRate = safeNumber(fromCurrency.rate_to_inr, NaN);
    const toRate = safeNumber(toCurrency.rate_to_inr, NaN);
    if (!isFinite(fromRate) || !isFinite(toRate) || fromRate === 0) {
      setConvertedAmount("N/A");
      return;
    }

    const sampleINR = currencies.find((c) => c.code === "INR" && safeNumber(c.rate_to_inr) === 1);

    let converted = NaN;
    if (sampleINR) {
      converted = (amount * fromRate) / toRate;
    } else {
      converted = (amount / fromRate) * toRate;
    }

    setConvertedAmount(isFinite(converted) ? converted.toFixed(4) : "N/A");
  };

  const getExchangeRate = (fromCode, toCode) => {
    const from = currencies.find((c) => c.code === fromCode);
    const to = currencies.find((c) => c.code === toCode);
    if (!from || !to) return "N/A";
    const fromRate = safeNumber(from.rate_to_inr, NaN);
    const toRate = safeNumber(to.rate_to_inr, NaN);
    if (!isFinite(fromRate) || !isFinite(toRate) || fromRate === 0) return "N/A";

    const sampleINR = currencies.find((c) => c.code === "INR" && safeNumber(c.rate_to_inr) === 1);
    let rate = NaN;
    if (sampleINR) {
      rate = fromRate / toRate;
    } else {
      rate = toRate / fromRate;
    }
    return isFinite(rate) ? rate.toFixed(6) : "N/A";
  };

  const formatRateToINR = (v) => {
    const n = safeNumber(v, NaN);
    return isFinite(n) ? n : "N/A";
  };

  // ====== Animation Variants ======
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  // ====== Stat Cards Data ======
  const statCards = [
    {
      label: "Default Currency",
      value: `${userCurrency} • ${getCurrencySymbol(userCurrency)}`,
      subtext: "Your primary currency",
      color: "from-emerald-400 to-teal-300",
      icon: Star,
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    {
      label: "Supported",
      value: `${currencies.length} Currencies`,
      subtext: "Available for conversion",
      color: "from-cyan-400 to-blue-300",
      icon: Globe,
      bg: "from-cyan-500/10 to-blue-500/5"
    },
    {
      label: "Base Currency",
      value: "Indian Rupee (INR)",
      subtext: "Rates shown vs INR",
      color: "from-purple-400 to-violet-300",
      icon: TrendingUp,
      bg: "from-purple-500/10 to-violet-500/5"
    }
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-[#030712] via-[#07101f] to-[#050816] text-white">

      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-[150px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,.05),transparent_40%)]" />
      </div>

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/4 h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>
        <div className="absolute bottom-40 right-20 h-2 w-2 rounded-full bg-cyan-400 animate-ping"/>
        <div className="absolute top-72 right-1/3 h-3 w-3 rounded-full bg-teal-400 animate-pulse"/>
      </div>

      {/* Sidebar */}
      <AdvancedSidebar 
        user={user} 
        mobileOpen={mobileSidebarOpen} 
        onMobileClose={() => setMobileSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-8 mt-16 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">

          {/* Glow orbs */}
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[180px]" />
          <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[180px]" />

          {/* ====== Page Header ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-emerald-500/[0.03] backdrop-blur-2xl p-4 md:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Currency Management</h1>
                <p className="text-xs text-slate-400">Manage currencies & exchange rates instantly.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddCurrency(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-3.5 py-2 font-semibold text-xs text-white shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center gap-2"
              >
                <Plus size={14} />
                Add Currency
              </button>
            </div>
          </motion.div>

          {/* ====== Currency Overview Banner ====== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 shadow-lg hover:border-emerald-500/40 transition-all"
            whileHover={{ y: -1 }}
          >
            <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-emerald-500/20 blur-[40px]" />
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Currency Overview</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currencies.length} currencies supported · Default: <span className="text-emerald-400 font-medium">{userCurrency}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Secure
                </span>
                <span className="hidden sm:flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Real-time rates
                </span>
              </div>
            </div>
          </motion.div>

          {/* ====== Stat Cards ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border border-white/10 rounded-2xl p-5 md:p-6 shadow-lg hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 group`}
                whileHover={{ y: -2 }}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-15 shadow-md flex-shrink-0`}>
                    <stat.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</p>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1 truncate">{stat.value}</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{stat.subtext}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== Main Content Row ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currencies List */}
            <motion.div
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 flex-shrink-0">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Your Currencies</h3>
                <span className="ml-auto text-xs text-slate-400 bg-[#1a2228] px-2.5 py-1 rounded-full font-medium">
                  {currencies.length} total
                </span>
              </div>
              
              <div className="space-y-3 max-h-[35rem] overflow-y-auto custom-scrollbar pr-1">
                {currencies.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Globe className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No currencies found. Add one to get started.</p>
                  </div>
                )}

                {currencies.map((currency, index) => (
                  <motion.div
                    key={currency.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      currency.is_default 
                        ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/30" 
                        : "bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-white/[0.03] flex-shrink-0">
                          <span className="text-xl sm:text-2xl">{getCurrencyFlag(currency.code)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-white text-xs sm:text-sm truncate">{currency.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono bg-[#1a2228] px-2 py-0.5 rounded-full">{currency.code}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            <span>{getCurrencySymbol(currency.code)}</span> • Rate: {formatRateToINR(currency.rate_to_inr)} INR
                          </p>
                          <p className="text-[11px] text-emerald-400/90 mt-0.5 font-mono">
                            1 INR = {(1 / (safeNumber(currency.rate_to_inr, 1))).toFixed(4)} {currency.code}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        {currency.is_default ? (
                          <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1.5 font-semibold border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Default Currency
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSetDefault(currency.code)}
                              className="flex-1 sm:flex-initial px-3 py-1.5 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-teal-300 text-xs rounded-lg hover:from-teal-500/30 hover:to-cyan-500/30 transition-all flex items-center justify-center gap-1 border border-teal-500/20 font-medium"
                            >
                              <Star className="w-3 h-3" />
                              Set Default
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRemoveCurrency(currency.code)}
                              className="px-3 py-1.5 bg-rose-500/10 text-rose-400 text-xs rounded-lg hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1 border border-rose-500/20 font-medium"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Currency Converter */}
            <motion.div
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg hover:border-emerald-500/20 transition-all"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20 flex-shrink-0">
                  <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-white">Currency Converter</h3>
                <span className="ml-auto text-xs text-slate-400 bg-[#1a2228] px-2.5 py-1 rounded-full font-medium">Live rates</span>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">From</label>
                    <select
                      value={converter.fromCurrency}
                      onChange={(e) => setConverter({ ...converter, fromCurrency: e.target.value })}
                      className="w-full p-3 bg-[#0a1017] border border-white/15 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                    >
                      {currencies.map((c) => (
                        <option key={`from-${c.code}`} value={c.code} className="bg-[#0d141a]">
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">To</label>
                    <select
                      value={converter.toCurrency}
                      onChange={(e) => setConverter({ ...converter, toCurrency: e.target.value })}
                      className="w-full p-3 bg-[#0a1017] border border-white/15 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                    >
                      {currencies.map((c) => (
                        <option key={`to-${c.code}`} value={c.code} className="bg-[#0d141a]">
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Amount</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter amount"
                    value={converter.amount}
                    onChange={(e) => setConverter({ ...converter, amount: e.target.value })}
                    className="w-full p-3 bg-[#0a1017] border border-white/15 rounded-xl text-white text-sm font-medium placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Converted Amount</p>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-black text-white mt-1 flex flex-wrap items-center gap-1.5">
                    {convertedAmount ? (
                      <>
                        <span className="text-slate-400">{converter.amount} {converter.fromCurrency}</span>
                        <span className="text-emerald-400 font-bold">=</span>
                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                          {convertedAmount} {converter.toCurrency}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-emerald-500/10 font-medium">
                    Rate: 1 {converter.fromCurrency} = {getExchangeRate(converter.fromCurrency, converter.toCurrency)} {converter.toCurrency}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ====== Exchange Rates Table ====== */}
          <motion.div
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                <Table className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Exchange Rates</h3>
              <span className="ml-auto text-xs text-slate-500 bg-[#1a2228] px-3 py-1 rounded-full">
                Base: INR
              </span>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-white/[0.03] text-slate-400 text-xs uppercase">
                    <th className="py-3.5 px-4 text-left font-medium rounded-tl-xl">Currency</th>
                    <th className="py-3.5 px-4 text-left font-medium">Code</th>
                    <th className="py-3.5 px-4 text-left font-medium">Symbol</th>
                    <th className="py-3.5 px-4 text-left font-medium">Rate to INR</th>
                    <th className="py-3.5 px-4 text-left font-medium">INR → Currency</th>
                    <th className="py-3.5 px-4 text-left font-medium rounded-tr-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currencies.map((currency) => (
                    <tr key={currency.code} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getCurrencyFlag(currency.code)}</span>
                          <span className="text-white font-medium truncate">{currency.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs">
                          {currency.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {getCurrencySymbol(currency.code)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-white font-semibold">
                          1 {currency.code} = <span className="text-emerald-400">{formatRateToINR(currency.rate_to_inr)}</span> INR
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-cyan-400">
                          1 INR = {(1 / safeNumber(currency.rate_to_inr, 1)).toFixed(4)} {currency.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {currency.is_default ? (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1.5 w-fit font-medium border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            Default
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-white/5 text-slate-400 text-xs rounded-full w-fit border border-white/5">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {currencies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        <Globe className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No currencies available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* ====== Footer Branding ====== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center py-6 border-t border-white/10"
          >
            <p className="text-xs text-slate-500">
              <span className="text-emerald-400 font-medium">FinTrack</span> — Trusted by finance professionals across India
            </p>
          </motion.div>

        </main>

        {/* ====== Add Currency Modal ====== */}
        {showAddCurrency && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
            onClick={() => setShowAddCurrency(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Add New Currency</h2>
              </div>

              <form onSubmit={handleAddCurrency} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Select Currency</label>
                  <select
                    value={newCurrency.code}
                    onChange={(e) => {
                      const sel = popularCurrencies.find((c) => c.code === e.target.value);
                      setNewCurrency({
                        ...newCurrency,
                        code: e.target.value,
                        name: sel?.name || "",
                        rate_to_inr: sel?.rate_to_inr ?? "",
                      });
                    }}
                    required
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                  >
                    <option value="" className="bg-[#0d141a]">Select Currency</option>
                    {popularCurrencies.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#0d141a]">
                        {c.flag} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Currency Name</label>
                  <input
                    type="text"
                    placeholder="Currency Name"
                    value={newCurrency.name}
                    onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                    required
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block font-medium">Rate to INR</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.012 for USD"
                    value={newCurrency.rate_to_inr}
                    onChange={(e) => setNewCurrency({ ...newCurrency, rate_to_inr: e.target.value })}
                    required
                    className="w-full p-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    How many INR equals 1 unit of this currency?
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/10">
                  <input
                    id="is_default"
                    type="checkbox"
                    checked={newCurrency.is_default}
                    onChange={(e) => setNewCurrency({ ...newCurrency, is_default: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/40"
                  />
                  <label htmlFor="is_default" className="text-sm text-slate-300 cursor-pointer font-medium">
                    Set as default currency
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowAddCurrency(false)}
                    className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 hover:text-white hover:border-slate-400/30 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-5 py-3 font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/60 transition-all"
                  >
                    Add Currency
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrenciesPage;