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
  UserPlus, UserMinus, Sparkles, RefreshCw, Check, Info
} from "lucide-react";

export default function SplitBillPage() {
  const { user, token } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Bill States
  const [billTitle, setBillTitle] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [splitMethod, setSplitMethod] = useState("equal"); // 'equal', 'exact', 'percentage'

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

  // Sync participant fields when participant count changes
  useEffect(() => {
    setParticipants(prev => {
      const nextParticipants = [...prev];
      if (participantsCount > nextParticipants.length) {
        // Add more
        for (let i = nextParticipants.length; i < participantsCount; i++) {
          const char = String.fromCharCode(65 + (i - 1)); // Friend A, B, C...
          nextParticipants.push({ name: `Friend ${char}`, amountPaid: "" });
        }
      } else if (participantsCount < nextParticipants.length) {
        // Truncate
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

  // Preset Payer helper (Quick select single payer)
  const setSinglePayer = (index) => {
    if (!billAmount || Number(billAmount) <= 0) {
      toast.error("Please enter a valid bill amount first");
      return;
    }
    setParticipants(prev =>
      prev.map((p, idx) => (idx === index ? { ...p, amountPaid: billAmount } : { ...p, amountPaid: "" }))
    );
  };

  // Perform Calculations
  const handleCalculate = (e) => {
    if (e) e.preventDefault();

    const totalBill = Number(billAmount);
    if (!totalBill || totalBill <= 0) {
      toast.error("Please enter a valid bill amount greater than 0");
      return;
    }

    // Verify Sum of Payments
    const totalPaid = participants.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
    if (Math.abs(totalPaid - totalBill) > 0.05) {
      // If no payments entered, auto-assume the first person (user) paid the whole bill
      const allEmpty = participants.every(p => !p.amountPaid || Number(p.amountPaid) === 0);
      if (allEmpty) {
        setParticipants(prev =>
          prev.map((p, idx) => (idx === 0 ? { ...p, amountPaid: billAmount } : p))
        );
        toast.success(`Assuming ${participants[0].name} paid the full bill.`);
      } else {
        toast.error(`The sum of paid amounts (${getSymbol()}${totalPaid}) does not match the total bill (${getSymbol()}${totalBill}). Please update paid amounts.`);
        return;
      }
    }

    // Compute shares based on method
    let shares = Array(participantsCount).fill(0);

    if (splitMethod === "equal") {
      const equalShare = Number((totalBill / participantsCount).toFixed(2));
      shares = Array(participantsCount).fill(equalShare);
      const totalShare = shares.reduce((a, b) => a + b, 0);
      const diff = Number((totalBill - totalShare).toFixed(2));
      if (diff !== 0) {
        shares[0] += diff; // offset rounding to the first person
      }
    } else if (splitMethod === "exact") {
      let sumShares = 0;
      shares = participants.map((_, idx) => {
        const val = Number(customShares[idx] || 0);
        sumShares += val;
        return val;
      });
      if (Math.abs(sumShares - totalBill) > 0.05) {
        toast.error(`Total shares (${getSymbol()}${sumShares}) do not match the bill amount (${getSymbol()}${totalBill})`);
        return;
      }
    } else if (splitMethod === "percentage") {
      let sumPercents = 0;
      shares = participants.map((_, idx) => {
        const pct = Number(customPercents[idx] || 0);
        sumPercents += pct;
        return Number(((totalBill * pct) / 100).toFixed(2));
      });
      if (Math.abs(sumPercents - 100) > 0.1) {
        toast.error(`Total percentages (${sumPercents}%) must sum up to exactly 100%`);
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
      const paid = Number(p.amountPaid || 0);
      const share = shares[idx];
      return {
        name: p.name || `Person ${idx + 1}`,
        balance: paid - share,
        id: idx
      };
    });

    // Simplify Debt
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

    // Greedy matching algorithm
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
    setRecordedLoans({}); // reset recorded tracker for new calculation
  };

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

  // Animations variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

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
                <p className="text-[11px] text-slate-400">Easily split shared expenses, calculate balances, and record debts among 2 to 10 friends.</p>
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
              <h2 className="text-sm font-bold tracking-wide text-white border-b border-white/10 pb-2.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Bill Details & Payer Setup
              </h2>

              <form onSubmit={handleCalculate} className="flex flex-col gap-4">
                {/* Row 1: Bill title and Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill Title / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Goa Trip Dinner"
                      value={billTitle}
                      onChange={(e) => setBillTitle(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                      required
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
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Participant Count Slider & Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Number of Persons</label>
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

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="px-3.5 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                {/* Section: Split Mode tabs */}
                <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">How to Split</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setSplitMethod("equal")}
                      className={`py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        splitMethod === "equal" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      Equally
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMethod("exact")}
                      className={`py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        splitMethod === "exact" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      Exact Shares
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMethod("percentage")}
                      className={`py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        splitMethod === "percentage" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      Percentages
                    </button>
                  </div>
                </div>

                {/* Dynamic Section: Participants Customization Table */}
                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Participants Info & Paid Amount</span>
                    <span className="text-[9px] text-slate-500 italic">Paid amount must sum up to {getSymbol()}{billAmount || 0}</span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto rounded-xl border border-white/5 bg-slate-950/40 p-2.5 flex flex-col gap-3">
                    {participants.map((p, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-2.5 bg-slate-900/40 p-2 rounded-lg border border-white/[0.03]">
                        {/* Member Name */}
                        <div className="flex-1 w-full flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 w-5 shrink-0 text-center">{idx + 1}</span>
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updateParticipantName(idx, e.target.value)}
                            placeholder={`Person ${idx + 1}`}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                            disabled={idx === 0} // lock primary user name
                          />
                        </div>

                        {/* Paid Amount */}
                        <div className="w-full sm:w-44 flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1.5 text-[10px] text-slate-500 font-semibold">{getSymbol()}</span>
                            <input
                              type="number"
                              value={p.amountPaid}
                              onChange={(e) => updateParticipantPaid(idx, e.target.value)}
                              placeholder="Paid 0.00"
                              className="w-full pl-6 pr-2 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                              min="0"
                              step="any"
                            />
                          </div>

                          {/* Quick single payer button */}
                          <button
                            type="button"
                            onClick={() => setSinglePayer(idx)}
                            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-400 font-bold rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-all shrink-0 cursor-pointer"
                            title="Paid full amount"
                          >
                            Paid Full
                          </button>
                        </div>

                        {/* Dynamic Custom Split shares/percentages fields */}
                        {splitMethod !== "equal" && (
                          <div className="w-full sm:w-28 shrink-0">
                            {splitMethod === "exact" ? (
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-[10px] text-slate-500 font-bold">{getSymbol()}</span>
                                <input
                                  type="number"
                                  placeholder="Share"
                                  value={customShares[idx] || ""}
                                  onChange={(e) => setCustomShares(prev => ({ ...prev, [idx]: e.target.value }))}
                                  className="w-full pl-6 pr-2 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                              </div>
                            ) : (
                              <div className="relative">
                                <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-bold">%</span>
                                <input
                                  type="number"
                                  placeholder="Percent"
                                  value={customPercents[idx] || ""}
                                  onChange={(e) => setCustomPercents(prev => ({ ...prev, [idx]: e.target.value }))}
                                  className="w-full pl-2 pr-6 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculate Actions */}
                <button
                  type="submit"
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-400 py-3 font-bold text-xs text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} className="animate-spin-slow" /> Calculate Bill Split
                </button>
              </form>
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
                  <Calculator className="w-4 h-4 text-purple-400" /> Split Results
                </h2>

                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-3 bg-slate-800/40 rounded-full text-slate-500 mb-3 border border-white/5">
                      <Calculator className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-300">No calculation performed yet</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Enter the bill amount, participant payments, select a split method, and click calculate.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-purple-200">Simplified Settlement Paths</h4>
                        <p className="text-[10px] text-slate-400 mt-1">We calculated balances and simplified the debts to minimize payments.</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {transactions.map((txn, index) => {
                        const isOwedToUser = txn.toIdx === 0; // The recipient is the first person (You)
                        const isRecorded = recordedLoans[index];

                        return (
                          <div
                            key={index}
                            className="bg-slate-950/60 rounded-xl border border-white/5 p-3 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              {/* Debtor owes Creditor */}
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className="text-xs font-bold text-slate-300 truncate" title={txn.from}>
                                  {txn.from}
                                </span>
                                <ArrowRight size={12} className="text-slate-500 shrink-0" />
                                <span className="text-xs font-bold text-purple-300 truncate" title={txn.to}>
                                  {txn.to}
                                </span>
                              </div>

                              {/* Amount */}
                              <div className="text-sm font-extrabold text-white shrink-0">
                                {getSymbol()}{txn.amount.toLocaleString("en-IN")}
                              </div>
                            </div>

                            {/* Action to Record as Friend Loan (Only visible if the debtor owes the user) */}
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
