// SplitBillPage.jsx - FinTrack Bill Splitter
import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, Calculator, ArrowRight, Save, DollarSign,
  UserPlus, UserMinus, Sparkles, Check, Info, AlertCircle
} from "lucide-react";

export default function SplitBillPage() {
  const { user, token } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Core Bill States
  const [billTitle, setBillTitle] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  
  // Advanced Toggles
  const [showAdvancedSplit, setShowAdvancedSplit] = useState(false);
  const [showMultiplePayers, setShowMultiplePayers] = useState(false);

  const [splitMethod, setSplitMethod] = useState("equal"); // 'equal', 'exact', 'percentage'
  const [singlePayerIdx, setSinglePayerIdx] = useState(0); // Default: first person (You)

  // Participant States
  const userName = user?.username || user?.name || user?.email?.split("@")[0] || "You";
  const [participantsCount, setParticipantsCount] = useState(3);
  const [participants, setParticipants] = useState([
    { name: `${userName} (You)`, amountPaid: "" },
    { name: "Friend A", amountPaid: "" },
    { name: "Friend B", amountPaid: "" }
  ]);

  // Split Shares (for exact and percentage splits)
  const [customShares, setCustomShares] = useState({});
  const [customPercents, setCustomPercents] = useState({});

  // Calculations Output
  const [transactions, setTransactions] = useState([]);
  const [recordedLoans, setRecordedLoans] = useState({}); // tracker for which transaction index was saved as loan
  const [submittingIds, setSubmittingIds] = useState({});
  const [validationError, setValidationError] = useState("");

  // Sync participant fields when participant count changes
  useEffect(() => {
    setParticipants(prev => {
      const nextParticipants = [...prev];
      if (participantsCount > nextParticipants.length) {
        for (let i = nextParticipants.length; i < participantsCount; i++) {
          const char = String.fromCharCode(65 + (i - 1)); // Friend A, B, C...
          nextParticipants.push({ name: `Friend ${char}`, amountPaid: "" });
        }
      } else if (participantsCount < nextParticipants.length) {
        nextParticipants.length = participantsCount;
      }
      return nextParticipants;
    });
  }, [participantsCount]);

  // Currency symbols map
  const currencySymbols = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥"
  };

  const getSymbol = () => currencySymbols[currency] || "₹";

  // Handle participant field updates
  const updateParticipantName = (index, value) => {
    setParticipants(prev =>
      prev.map((p, idx) => (idx === index ? { ...p, name: value } : p))
    );
  };

  const updateParticipantPaid = (index, value) => {
    setParticipants(prev =>
      prev.map((p, idx) => (idx === index ? { ...p, amountPaid: value } : p))
    );
  };

  // Perform Calculations (Automatic Real-time)
  useEffect(() => {
    const totalBill = Number(billAmount);
    if (!totalBill || totalBill <= 0) {
      setTransactions([]);
      setValidationError("");
      return;
    }

    // Determine Paid Amounts for each participant
    let paidAmounts = [];
    if (showMultiplePayers) {
      paidAmounts = participants.map(p => Number(p.amountPaid || 0));
      const totalPaid = paidAmounts.reduce((a, b) => a + b, 0);
      if (Math.abs(totalPaid - totalBill) > 0.1) {
        setValidationError(`Sum of payments (${getSymbol()}${totalPaid.toFixed(2)}) must match the bill amount (${getSymbol()}${totalBill})`);
        setTransactions([]);
        return;
      }
    } else {
      paidAmounts = participants.map((_, idx) => (idx === singlePayerIdx ? totalBill : 0));
    }

    setValidationError("");

    // Compute shares based on method
    let shares = Array(participantsCount).fill(0);

    if (splitMethod === "equal" || !showAdvancedSplit) {
      const equalShare = Number((totalBill / participantsCount).toFixed(2));
      shares = Array(participantsCount).fill(equalShare);
      const totalShare = shares.reduce((a, b) => a + b, 0);
      const diff = Number((totalBill - totalShare).toFixed(2));
      if (diff !== 0) {
        shares[0] += diff; // offset rounding to the first person
      }
    } else if (splitMethod === "exact" && showAdvancedSplit) {
      let sumShares = 0;
      shares = participants.map((_, idx) => {
        const val = Number(customShares[idx] || 0);
        sumShares += val;
        return val;
      });
      if (Math.abs(sumShares - totalBill) > 0.1) {
        setValidationError(`Sum of shares (${getSymbol()}${sumShares}) must match the bill amount (${getSymbol()}${totalBill})`);
        setTransactions([]);
        return;
      }
    } else if (splitMethod === "percentage" && showAdvancedSplit) {
      let sumPercents = 0;
      shares = participants.map((_, idx) => {
        const pct = Number(customPercents[idx] || 0);
        sumPercents += pct;
        return Number(((totalBill * pct) / 100).toFixed(2));
      });
      if (Math.abs(sumPercents - 100) > 0.5) {
        setValidationError(`Sum of percentages (${sumPercents}%) must equal exactly 100%`);
        setTransactions([]);
        return;
      }
      const totalShare = shares.reduce((a, b) => a + b, 0);
      const diff = Number((totalBill - totalShare).toFixed(2));
      if (diff !== 0) {
        shares[0] += diff;
      }
    }

    // Compute net balances
    const balances = participants.map((p, idx) => {
      const paid = paidAmounts[idx];
      const share = shares[idx];
      return {
        name: p.name || `Person ${idx + 1}`,
        balance: paid - share,
        id: idx
      };
    });

    // Simplify debts
    const debtors = balances
      .filter(b => b.balance < -0.01)
      .map(b => ({ ...b, balance: Math.abs(b.balance) }))
      .sort((a, b) => b.balance - a.balance);

    const creditors = balances
      .filter(b => b.balance > 0.01)
      .sort((a, b) => b.balance - a.balance);

    const results = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const amount = Math.min(debtor.balance, creditor.balance);

      results.push({
        from: debtor.name,
        fromIdx: debtor.id,
        to: creditor.name,
        toIdx: creditor.id,
        amount: Number(amount.toFixed(2))
      });

      debtor.balance -= amount;
      creditor.balance -= amount;

      if (debtor.balance < 0.01) dIdx++;
      if (creditor.balance < 0.01) cIdx++;
    }

    setTransactions(results);
  }, [
    billAmount, participants, splitMethod, singlePayerIdx,
    customShares, customPercents, showAdvancedSplit, showMultiplePayers, participantsCount
  ]);

  // Record a transaction as a Friend Loan in the database
  const handleRecordLoan = async (index, txn) => {
    const friendName = txn.from;
    const loanAmount = txn.amount;
    const desc = billTitle.trim() ? `Split: ${billTitle.trim()}` : "Bill Split Share";

    try {
      setSubmittingIds(prev => ({ ...prev, [index]: true }));
      const payload = {
        friend_name: friendName,
        amount: Number(loanAmount),
        loan_date: new Date().toISOString().split("T")[0],
        notes: desc,
        is_returned: false
      };

      await apiClient.post("/api/friend-loans", payload);
      toast.success(`🎉 Recorded ₹${loanAmount} owed by ${friendName} as a Friend Loan!`);
      setRecordedLoans(prev => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error("Error recording loan:", err);
      toast.error(err.response?.data?.error || "Failed to record loan.");
    } finally {
      setSubmittingIds(prev => ({ ...prev, [index]: false }));
    }
  };

  // Card Variants
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">
      {/* Animated Background Atmosphere */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-purple-600/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" />
      </div>

      {/* Sidebar */}
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 md:p-6 mt-14 flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[#09101d] backdrop-blur-2xl px-4 py-3.5 md:px-5 md:py-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Split Bills</h1>
                <p className="text-[11px] text-slate-400">Calculate shared costs instantly. Defaults to equal splits with automatic live calculations.</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Input Config Card (left/7 cols) */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/30 p-4 md:p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4 text-white"
            >
              <div className="flex flex-col gap-4">
                {/* 1. Basic Bill Entry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill Title / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Goa Trip Dinner"
                      value={billTitle}
                      onChange={(e) => setBillTitle(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bill Amount</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-semibold">{getSymbol()}</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                        min="1"
                        step="any"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Payer and Count Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Number of Persons (2 to 10)</label>
                      <span className="text-xs font-bold text-purple-400">{participantsCount} Persons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setParticipantsCount(p => Math.max(2, p - 1))}
                        disabled={participantsCount <= 2}
                        className="p-2 bg-slate-950 border border-white/10 hover:border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <UserMinus size={14} />
                      </button>
                      <input
                        type="range"
                        min="2"
                        max="10"
                        value={participantsCount}
                        onChange={(e) => setParticipantsCount(parseInt(e.target.value))}
                        className="flex-1 accent-purple-500 bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setParticipantsCount(p => Math.min(10, p + 1))}
                        disabled={participantsCount >= 10}
                        className="p-2 bg-slate-950 border border-white/10 hover:border-slate-800 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Simplified "Who Paid" Dropdown Selector (hides manual calculations) */}
                  {!showMultiplePayers ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Who Paid the Bill?</label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMultiplePayers(true);
                            setSinglePayerIdx(-1);
                          }}
                          className="text-[9px] text-purple-400 hover:underline cursor-pointer"
                        >
                          Multiple Payers?
                        </button>
                      </div>
                      <select
                        value={singlePayerIdx}
                        onChange={(e) => setSinglePayerIdx(parseInt(e.target.value))}
                        className="px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        {participants.map((p, idx) => (
                          <option key={idx} value={idx}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Multiple Payer Mode</label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMultiplePayers(false);
                            setSinglePayerIdx(0);
                          }}
                          className="text-[9px] text-purple-400 hover:underline cursor-pointer"
                        >
                          Single Payer?
                        </button>
                      </div>
                      <div className="text-[10px] bg-purple-500/5 text-purple-300 p-2.5 border border-purple-500/10 rounded-xl">
                        Specify individual payments inside the participant list below.
                      </div>
                    </div>
                  )}
                </div>

                {/* Stepper details: Participant Names */}
                <div className="border-t border-white/5 pt-4">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customize Participant Names</span>
                    <span className="text-[10px] text-slate-500 italic">Person 1 is always You</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                    {participants.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-950/50 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 w-5 shrink-0 text-center">{idx + 1}</span>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => updateParticipantName(idx, e.target.value)}
                          placeholder={`Friend ${String.fromCharCode(65 + (idx - 1))}`}
                          className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-slate-600"
                          disabled={idx === 0} // Lock user name
                        />

                        {/* If multiple payers: render payment input */}
                        {showMultiplePayers && (
                          <div className="relative w-24 shrink-0">
                            <span className="absolute left-2 top-1.5 text-[10px] text-slate-500 font-bold">{getSymbol()}</span>
                            <input
                              type="number"
                              placeholder="Paid"
                              value={p.amountPaid}
                              onChange={(e) => updateParticipantPaid(idx, e.target.value)}
                              className="w-full pl-5 pr-1.5 py-1 bg-slate-950 border border-white/10 rounded-lg text-[10px] text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Advanced Split Share Toggles */}
                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showAdvancedSplit}
                        onChange={(e) => {
                          setShowAdvancedSplit(e.target.checked);
                          if (!e.target.checked) setSplitMethod("equal");
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500 accent-purple-500"
                      />
                      Customize individual split shares (unequal)
                    </label>
                  </div>

                  <AnimatePresence>
                    {showAdvancedSplit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-1 rounded-xl border border-white/5 mb-3">
                          <button
                            type="button"
                            onClick={() => setSplitMethod("exact")}
                            className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                              splitMethod === "exact" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-900"
                            }`}
                          >
                            Exact Shares
                          </button>
                          <button
                            type="button"
                            onClick={() => setSplitMethod("percentage")}
                            className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                              splitMethod === "percentage" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-900"
                            }`}
                          >
                            Percentages (%)
                          </button>
                        </div>

                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                          {participants.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 bg-slate-950/30 p-2 rounded-lg border border-white/5">
                              <span className="text-xs text-slate-300 truncate">{p.name}</span>
                              <div className="w-32 shrink-0">
                                {splitMethod === "exact" ? (
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1.5 text-[10px] text-slate-500 font-bold">{getSymbol()}</span>
                                    <input
                                      type="number"
                                      placeholder="Owes"
                                      value={customShares[idx] || ""}
                                      onChange={(e) => setCustomShares(prev => ({ ...prev, [idx]: e.target.value }))}
                                      className="w-full pl-6 pr-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                    />
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-bold">%</span>
                                    <input
                                      type="number"
                                      placeholder="%"
                                      value={customPercents[idx] || ""}
                                      onChange={(e) => setCustomPercents(prev => ({ ...prev, [idx]: e.target.value }))}
                                      className="w-full pl-2.5 pr-6 py-1 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Calculations Output Card (right/5 cols) */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-5 flex flex-col gap-4"
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/30 p-4 md:p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4 text-white">
                <h2 className="text-sm font-bold tracking-wide text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-400" /> Split Results (Live Calc)
                </h2>

                {validationError ? (
                  <div className="flex items-center gap-2.5 bg-rose-500/10 text-rose-300 p-3.5 border border-rose-500/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <p className="text-[11px] font-medium leading-relaxed">{validationError}</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-3 bg-slate-800/40 rounded-full text-slate-500 mb-3 border border-white/5">
                      <Users className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-300">Enter a bill amount to start</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Splits are calculated in real-time as you type. Set your bill amount above!
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-purple-200">Simplified Settlement Paths</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">We simplified the transfer paths to reduce payments.</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {transactions.map((txn, index) => {
                        const isOwedToUser = txn.toIdx === 0;
                        const isRecorded = recordedLoans[index];

                        return (
                          <div
                            key={index}
                            className="bg-slate-950/60 rounded-xl border border-white/5 p-3 flex flex-col gap-2 hover:bg-slate-950/80 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className="text-xs font-bold text-slate-300 truncate" title={txn.from}>
                                  {txn.from}
                                </span>
                                <ArrowRight size={12} className="text-slate-500 shrink-0" />
                                <span className="text-xs font-bold text-purple-300 truncate" title={txn.to}>
                                  {txn.to}
                                </span>
                              </div>

                              <div className="text-sm font-extrabold text-white shrink-0">
                                {getSymbol()}{txn.amount.toLocaleString("en-IN")}
                              </div>
                            </div>

                            {/* Direct Record Action */}
                            {isOwedToUser && (
                              <div className="flex items-center justify-end mt-1 border-t border-white/5 pt-2">
                                <button
                                  onClick={() => handleRecordLoan(index, txn)}
                                  disabled={isRecorded || submittingIds[index]}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 ${
                                    isRecorded
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/10"
                                  }`}
                                >
                                  {isRecorded ? (
                                    <>
                                      <Check size={10} /> Recorded as Loan
                                    </>
                                  ) : submittingIds[index] ? (
                                    "Recording..."
                                  ) : (
                                    <>
                                      <Save size={10} /> Record as Friend Loan
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
