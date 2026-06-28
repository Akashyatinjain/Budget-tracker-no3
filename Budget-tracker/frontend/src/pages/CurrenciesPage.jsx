// CurrenciesPage.jsx - FinTrack Theme
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth, api } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiRefreshCw,
  FiDollarSign,
  FiGlobe,
  FiTrendingUp,
  FiZap,
  FiShield,
  FiClock,
  FiStar,
  FiTrash2,
  FiCheckCircle
} from "react-icons/fi";

const CurrenciesPage = () => {
  const { user, token } = useAuth();
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
  }, [mobileSidebarOpen, showAddCurrency]);

  useEffect(() => {
    fetchCurrencies();
  }, [token]);

  useEffect(() => {
    calculateConversion();
  }, [converter.amount, converter.fromCurrency, converter.toCurrency, currencies]);

  const fetchCurrencies = async () => {
    if (!token) {
      setCurrencies(popularCurrencies.map((c) => ({ ...c, is_default: c.code === "INR" })));
      setUserCurrency("INR");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/api/currencies");
      const currenciesData = res?.data?.currencies || res?.data || [];
      if (!Array.isArray(currenciesData) || currenciesData.length === 0) {
        await initializeDefaultCurrencies();
        const refetch = await api.get("/api/currencies");
        const redata = refetch?.data?.currencies || refetch?.data || popularCurrencies;
        setCurrencies(redata);
        const def = redata.find((c) => c.is_default);
        if (def) setUserCurrency(def.code);
      } else {
        setCurrencies(currenciesData);
        const def = currenciesData.find((c) => c.is_default);
        if (def) setUserCurrency(def.code);
      }
    } catch (err) {
      console.error("Fetch currencies error:", err);
      setCurrencies(popularCurrencies.map((c) => ({ ...c, is_default: c.code === "INR" })));
      setUserCurrency("INR");
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultCurrencies = async () => {
    if (!token) return;
    try {
      for (const currency of popularCurrencies) {
        await api.post("/api/currencies", {
          code: currency.code,
          name: currency.name,
          rate_to_inr: currency.rate_to_inr,
          is_default: currency.code === "INR",
        });
      }
    } catch (err) {
      console.error("Initialize currencies error:", err);
    }
  };

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
      await api.post("/api/currencies", {
        code: newCurrency.code,
        name: newCurrency.name,
        rate_to_inr: rateNum,
        is_default: !!newCurrency.is_default,
      });
      toast.success("Currency added successfully!");
      setShowAddCurrency(false);
      setNewCurrency({ code: "", name: "", rate_to_inr: "", is_default: false });
      fetchCurrencies();
    } catch (err) {
      console.error("Add currency error:", err);
      toast.error("Error adding currency. Please try again.");
    }
  };

  const handleSetDefault = async (currencyCode) => {
    try {
      await api.put("/api/currencies/default", { currency_code: currencyCode });
      toast.success(`Default currency set to ${currencyCode}`);
      setUserCurrency(currencyCode);
      fetchCurrencies();
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
      await api.delete(`/api/currencies/${currencyCode}`);
      toast.success("Currency removed.");
      fetchCurrencies();
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
        <AdvancedSidebar user={user} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-3 text-emerald-400"
          >
            <FiGlobe className="w-6 h-6" />
            <span>Loading currencies...</span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
      <AdvancedSidebar user={user} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 sm:p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
          >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Currencies</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  <FiZap className="w-3 h-3" />
                  AI Insights Active
                </span>
              </div>
              <p className="text-gray-400 text-sm">Manage currencies & exchange rates</p>
            </div>

            <button
              onClick={() => setShowAddCurrency(true)}
              className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-4 py-2.5 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2 justify-center"
            >
              <FiPlus className="w-4 h-4" />
              Add Currency
            </button>
          </motion.div>

          {/* AI Insight Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <FiGlobe className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Currency Overview</p>
                <p className="text-xs text-gray-400">
                  {currencies.length} currencies supported · Default: {userCurrency}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FiShield className="w-3 h-3 text-emerald-400" />
                Secure
              </span>
              <span className="hidden sm:inline">
                <FiClock className="w-3 h-3 inline mr-1" />
                Real-time rates
              </span>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: "Default Currency",
                value: `${userCurrency} • ${getCurrencySymbol(userCurrency)}`,
                subtext: "Your primary currency",
                color: "text-emerald-400",
                icon: FiStar,
                bgColor: "bg-emerald-500/20"
              },
              {
                label: "Supported",
                value: `${currencies.length} Currencies`,
                subtext: "Available for conversion",
                color: "text-teal-400",
                icon: FiGlobe,
                bgColor: "bg-teal-500/20"
              },
              {
                label: "Base Currency",
                value: "Indian Rupee (INR)",
                subtext: "Rates shown vs INR",
                color: "text-yellow-400",
                icon: FiTrendingUp,
                bgColor: "bg-yellow-500/20"
              }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <h3 className={`text-lg font-semibold ${stat.color}`}>
                      {stat.value}
                    </h3>
                    <p className="text-xs text-gray-500">{stat.subtext}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currencies list */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Your Currencies</h3>
              <div className="space-y-3 max-h-[40rem] overflow-y-auto pr-2">
                {currencies.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No currencies found. Add one.</div>
                )}

                {currencies.map((currency, index) => (
                  <motion.div
                    key={currency.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                      currency.is_default 
                        ? "bg-emerald-500/5 border-emerald-500/20" 
                        : "bg-white/5 border-white/10 hover:border-emerald-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{getCurrencyFlag(currency.code)}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white text-sm truncate">{currency.name}</h4>
                          <span className="text-xs text-gray-400 font-mono">{currency.code}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {getCurrencySymbol(currency.code)} • Rate: {formatRateToINR(currency.rate_to_inr)}
                        </p>
                        <p className="text-xs text-emerald-400 mt-0.5">
                          1 INR = {(1 / (safeNumber(currency.rate_to_inr, 1))).toFixed(4)} {currency.code}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {currency.is_default ? (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3" />
                          Default
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSetDefault(currency.code)}
                            className="px-3 py-1.5 bg-teal-500/20 text-teal-400 text-sm rounded-lg hover:bg-teal-500/30 w-full sm:w-auto transition flex items-center gap-1"
                          >
                            <FiStar className="w-3 h-3" />
                            Set Default
                          </button>
                          <button
                            onClick={() => handleRemoveCurrency(currency.code)}
                            className="px-3 py-1.5 bg-rose-500/20 text-rose-400 text-sm rounded-lg hover:bg-rose-500/30 w-full sm:w-auto transition flex items-center gap-1"
                          >
                            <FiTrash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Converter */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">💱 Currency Converter</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">From</label>
                    <select
                      value={converter.fromCurrency}
                      onChange={(e) => setConverter({ ...converter, fromCurrency: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                    >
                      {currencies.map((c) => (
                        <option key={`from-${c.code}`} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">To</label>
                    <select
                      value={converter.toCurrency}
                      onChange={(e) => setConverter({ ...converter, toCurrency: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                    >
                      {currencies.map((c) => (
                        <option key={`to-${c.code}`} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Amount</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter amount"
                    value={converter.amount}
                    onChange={(e) => setConverter({ ...converter, amount: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  />
                </div>

                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <p className="text-sm text-gray-400">Result</p>
                  <h4 className="text-lg md:text-xl font-bold text-emerald-400 mt-1">
                    {converter.amount} {converter.fromCurrency} = {convertedAmount || "—"} {converter.toCurrency}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Rate: 1 {converter.fromCurrency} = {getExchangeRate(converter.fromCurrency, converter.toCurrency)} {converter.toCurrency}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Exchange rates table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <FiTrendingUp className="text-emerald-400 w-5 h-5" />
              <h3 className="text-lg font-semibold text-white">📈 Exchange Rates (Base: INR)</h3>
            </div>
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="py-3.5 px-4 text-left font-medium">Currency</th>
                    <th className="py-3.5 px-4 text-left font-medium">Code</th>
                    <th className="py-3.5 px-4 text-left font-medium">Symbol</th>
                    <th className="py-3.5 px-4 text-left font-medium">Rate to INR</th>
                    <th className="py-3.5 px-4 text-left font-medium">INR → Currency</th>
                    <th className="py-3.5 px-4 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currencies.map((currency) => (
                    <tr key={currency.code} className="hover:bg-white/5 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCurrencyFlag(currency.code)}</span>
                          <span className="truncate text-white">{currency.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{currency.code}</td>
                      <td className="py-3 px-4 text-gray-400">{getCurrencySymbol(currency.code)}</td>
                      <td className="py-3 px-4 font-semibold text-gray-300">
                        1 {currency.code} = {formatRateToINR(currency.rate_to_inr)} INR
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        1 INR = {(1 / safeNumber(currency.rate_to_inr, 1)).toFixed(4)} {currency.code}
                      </td>
                      <td className="py-3 px-4">
                        {currency.is_default ? (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1 w-fit">
                            <FiCheckCircle className="w-3 h-3" />
                            Default
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-white/5 text-gray-400 text-xs rounded-full w-fit">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {currencies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">No currencies available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>

        {/* Add Currency Modal - FinTrack Style */}
        {showAddCurrency && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[11000] p-4"
            onClick={() => setShowAddCurrency(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111118] border border-white/10 p-5 sm:p-6 rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-white mb-4">Add New Currency</h2>

              <form onSubmit={handleAddCurrency} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Select Currency</label>
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
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  >
                    <option value="">Select Currency</option>
                    {popularCurrencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Currency Name</label>
                  <input
                    type="text"
                    placeholder="Currency Name"
                    value={newCurrency.name}
                    onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Rate to INR</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 0.012 for USD"
                    value={newCurrency.rate_to_inr}
                    onChange={(e) => setNewCurrency({ ...newCurrency, rate_to_inr: e.target.value })}
                    required
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <input
                    id="is_default"
                    type="checkbox"
                    checked={newCurrency.is_default}
                    onChange={(e) => setNewCurrency({ ...newCurrency, is_default: e.target.checked })}
                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500/40"
                  />
                  <label htmlFor="is_default" className="text-sm text-gray-300 cursor-pointer">
                    Set as default currency
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddCurrency(false)}
                    className="px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-500/20"
                  >
                    Add Currency
                  </button>
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