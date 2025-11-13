// CurrenciesPage.jsx (Responsive, fixed & robust)
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";

const CurrenciesPage = () => {
  const [currencies, setCurrencies] = useState([]);
  const [userCurrency, setUserCurrency] = useState("INR");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
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

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Popular currencies used for flags/symbols & fallback seed
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

  // Helpers
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

  // Prevent background scroll if either sidebar or modal open
  useEffect(() => {
    document.body.style.overflow =
      mobileSidebarOpen || showAddCurrency ? "hidden" : "auto";
  }, [mobileSidebarOpen, showAddCurrency]);

  // Fetch user & currencies on mount
  useEffect(() => {
    fetchUser();
    fetchCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate conversion when converter or currencies change
  useEffect(() => {
    calculateConversion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [converter.amount, converter.fromCurrency, converter.toCurrency, currencies]);

  // Fetch user
  const fetchUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig);
      setUser(res.data?.user || res.data || null);
    } catch (err) {
      console.error("Fetch user error:", err);
      setUser(null);
    }
  };

  // Fetch currencies (with fallback & initialization)
  const fetchCurrencies = async () => {
    // If no token, show fallback list (useful for local dev)
    if (!token) {
      setCurrencies(popularCurrencies.map((c) => ({ ...c, is_default: c.code === "INR" })));
      setUserCurrency("INR");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${VITE_BASE_URL}/api/currencies`, axiosConfig);
      const currenciesData = res?.data?.currencies || res?.data || [];
      if (!Array.isArray(currenciesData) || currenciesData.length === 0) {
        // Initialize remote with popular list if empty
        await initializeDefaultCurrencies();
        const refetch = await axios.get(`${VITE_BASE_URL}/api/currencies`, axiosConfig);
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
      // fallback to local popular list
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
        // attempt to create each currency; server should handle duplicates
        await axios.post(
          `${VITE_BASE_URL}/api/currencies`,
          {
            code: currency.code,
            name: currency.name,
            rate_to_inr: currency.rate_to_inr,
            is_default: currency.code === "INR",
          },
          axiosConfig
        );
      }
    } catch (err) {
      console.error("Initialize currencies error:", err);
    }
  };

  // Add new currency
  const handleAddCurrency = async (e) => {
    e.preventDefault();
    if (!newCurrency.code || !newCurrency.name || newCurrency.rate_to_inr === "") {
      alert("Please fill all fields.");
      return;
    }
    const rateNum = safeNumber(newCurrency.rate_to_inr);
    if (!isFinite(rateNum)) {
      alert("Invalid rate. Use a numeric value.");
      return;
    }

    try {
      await axios.post(
        `${VITE_BASE_URL}/api/currencies`,
        {
          code: newCurrency.code,
          name: newCurrency.name,
          rate_to_inr: rateNum,
          is_default: !!newCurrency.is_default,
        },
        axiosConfig
      );
      setShowAddCurrency(false);
      setNewCurrency({ code: "", name: "", rate_to_inr: "", is_default: false });
      fetchCurrencies();
    } catch (err) {
      console.error("Add currency error:", err);
      alert("Error adding currency. Please try again.");
    }
  };

  // Set default currency
  const handleSetDefault = async (currencyCode) => {
    try {
      await axios.put(
        `${VITE_BASE_URL}/api/currencies/default`,
        { currency_code: currencyCode },
        axiosConfig
      );
      setUserCurrency(currencyCode);
      fetchCurrencies();
    } catch (err) {
      console.error("Set default currency error:", err);
      alert("Error setting default currency. Please try again.");
    }
  };

  // Remove currency
  const handleRemoveCurrency = async (currencyCode) => {
    if (currencyCode === userCurrency) {
      alert("Cannot remove your default currency. Set another default first.");
      return;
    }
    try {
      await axios.delete(`${VITE_BASE_URL}/api/currencies/${currencyCode}`, axiosConfig);
      fetchCurrencies();
    } catch (err) {
      console.error("Remove currency error:", err);
      alert("Error removing currency. Please try again.");
    }
  };

  // Conversion logic (robust to different 'rate_to_inr' interpretations)
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

    // If INR entry exists and its rate == 1, treat rate_to_inr as "INR per 1 unit"
    const sampleINR = currencies.find((c) => c.code === "INR" && safeNumber(c.rate_to_inr) === 1);

    let converted = NaN;
    if (sampleINR) {
      // INR per unit style: amount (in from) -> INR -> to
      // amount_in_inr = amount * fromRate
      // converted = amount_in_inr / toRate
      converted = (amount * fromRate) / toRate;
    } else {
      // fallback inverse style: units per INR
      // amount_in_inr = amount / fromRate
      // converted = amount_in_inr * toRate
      converted = (amount / fromRate) * toRate;
    }

    setConvertedAmount(isFinite(converted) ? converted.toFixed(4) : "N/A");
  };

  // Exchange rate display
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
      // 1 from = (fromRate INR); 1 to = (toRate INR) => 1 from = (fromRate / toRate) to
      rate = fromRate / toRate;
    } else {
      // inverse style: 1 from = (toRate / fromRate) to
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
      <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
        <AdvancedSidebar user={user} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-purple-400 text-xl">Loading currencies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
      <AdvancedSidebar user={user} mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 sm:p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-400">Currencies</h1>
              <p className="text-gray-400 text-sm md:text-base">Manage currencies & exchange rates</p>
            </div>

            <div className="w-full md:w-auto flex gap-2">
              <button
                onClick={() => setShowAddCurrency(true)}
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-800 transition-all duration-200 shadow-md flex items-center gap-2 justify-center"
              >
                🌍 Add Currency
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-400">Default Currency</p>
              <h3 className="text-lg font-semibold text-green-400">{userCurrency} • {getCurrencySymbol(userCurrency)}</h3>
              <p className="text-xs text-gray-500">Your primary currency</p>
            </div>

            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-400">Supported</p>
              <h3 className="text-lg font-semibold text-blue-400">{currencies.length} Currencies</h3>
              <p className="text-xs text-gray-500">Available for conversion & tracking</p>
            </div>

            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 shadow-md">
              <p className="text-sm text-gray-400">Base</p>
              <h3 className="text-lg font-semibold text-yellow-400">Indian Rupee (INR)</h3>
              <p className="text-xs text-gray-500">Rates shown vs INR</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currencies list */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Your Currencies</h3>
              <div className="space-y-3 max-h-[40rem] overflow-y-auto pr-2">
                {currencies.length === 0 && (
                  <div className="text-center py-8 text-gray-400">No currencies found. Add one.</div>
                )}

                {currencies.map((currency) => (
                  <div
                    key={currency.code}
                    className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                      currency.is_default ? "bg-purple-900/30 border-purple-500" : "bg-gray-900/10 border-gray-700 hover:border-purple-600"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{getCurrencyFlag(currency.code)}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white text-sm truncate">{currency.name}</h4>
                          <span className="text-xs text-gray-400 font-mono">{currency.code}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{getCurrencySymbol(currency.code)} • Rate: {formatRateToINR(currency.rate_to_inr)}</p>
                        <p className="text-xs text-purple-400 mt-1">1 INR = {(1 / (safeNumber(currency.rate_to_inr, 1))).toFixed(4)} {currency.code}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {currency.is_default ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Default</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSetDefault(currency.code)}
                            className="px-3 py-1 md:px-4 md:py-2 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 w-full sm:w-auto transition"
                          >
                            Set Default
                          </button>
                          <button
                            onClick={() => handleRemoveCurrency(currency.code)}
                            className="px-3 py-1 md:px-4 md:py-2 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 w-full sm:w-auto transition"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Converter */}
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">💱 Currency Converter</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">From</label>
                    <select
                      value={converter.fromCurrency}
                      onChange={(e) => setConverter({ ...converter, fromCurrency: e.target.value })}
                      className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      {currencies.map((c) => (
                        <option key={`from-${c.code}`} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">To</label>
                    <select
                      value={converter.toCurrency}
                      onChange={(e) => setConverter({ ...converter, toCurrency: e.target.value })}
                      className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
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
                  <label className="block text-sm text-gray-400 mb-2">Amount</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter amount"
                    value={converter.amount}
                    onChange={(e) => setConverter({ ...converter, amount: e.target.value })}
                    className="w-full bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                  <p className="text-sm text-gray-400">Result</p>
                  <h4 className="text-lg md:text-xl font-bold text-purple-300 mt-1">
                    {converter.amount} {converter.fromCurrency} = {convertedAmount || "—"} {converter.toCurrency}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Rate: 1 {converter.fromCurrency} = {getExchangeRate(converter.fromCurrency, converter.toCurrency)} {converter.toCurrency}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange rates table */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-4 md:p-5 shadow-md">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">📈 Exchange Rates (Base: INR)</h3>
            <div className="overflow-x-auto rounded-md">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-purple-950/50 text-purple-300 uppercase text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left">Currency</th>
                    <th className="py-3 px-4 text-left">Code</th>
                    <th className="py-3 px-4 text-left">Symbol</th>
                    <th className="py-3 px-4 text-left">Rate to INR</th>
                    <th className="py-3 px-4 text-left">INR → Currency</th>
                    <th className="py-3 px-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((currency) => (
                    <tr key={currency.code} className="border-t border-purple-800/30 hover:bg-purple-900/20 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCurrencyFlag(currency.code)}</span>
                          <span className="truncate">{currency.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-300">{currency.code}</td>
                      <td className="py-3 px-4 text-gray-400">{getCurrencySymbol(currency.code)}</td>
                      <td className="py-3 px-4 font-semibold">
                        1 {currency.code} = {formatRateToINR(currency.rate_to_inr)} INR
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-400">
                        1 INR = {(1 / safeNumber(currency.rate_to_inr, 1)).toFixed(4)} {currency.code}
                      </td>
                      <td className="py-3 px-4">
                        {currency.is_default ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Default</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">Active</span>
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
          </div>
        </main>

        {/* Add Currency Modal */}
        {showAddCurrency && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[11000] p-4"
            onClick={() => setShowAddCurrency(false)}
          >
            <div
              className="bg-[#14001f] border border-purple-800/40 p-5 sm:p-6 rounded-xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-purple-300 mb-4">Add New Currency</h2>

              <form onSubmit={handleAddCurrency} className="space-y-3">
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
                  className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                >
                  <option value="">Select Currency</option>
                  {popularCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Currency Name"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                  required
                  className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                />

                <input
                  type="number"
                  step="any"
                  placeholder="Rate to INR (e.g., 0.012 for USD)"
                  value={newCurrency.rate_to_inr}
                  onChange={(e) => setNewCurrency({ ...newCurrency, rate_to_inr: e.target.value })}
                  required
                  className="w-full p-3 bg-[#1b0128] border border-purple-700 rounded-lg text-gray-200"
                />

                <div className="flex items-center gap-2">
                  <input
                    id="is_default"
                    type="checkbox"
                    checked={newCurrency.is_default}
                    onChange={(e) => setNewCurrency({ ...newCurrency, is_default: e.target.checked })}
                    className="h-4 w-4 rounded border-purple-700 bg-[#1b0128] text-purple-500"
                  />
                  <label htmlFor="is_default" className="text-sm text-gray-300">Set as default currency</label>
                </div>

                <div className="flex justify-end gap-3 mt-3">
                  <button type="button" onClick={() => setShowAddCurrency(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-white">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 rounded-lg text-white">Add Currency</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrenciesPage;
