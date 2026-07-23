import React, { useState, useMemo, useEffect } from "react";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  Percent, DollarSign, Calendar, Clock, BarChart3,
  Calculator, Sparkles, TrendingUp, Info, ChevronRight
} from "lucide-react";

export default function EmiCalculatorPage() {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [principal, setPrincipal] = useState(1000000); // 10 Lakhs default
  const [interestRate, setInterestRate] = useState(9.5); // 9.5% p.a. default
  const [tenure, setTenure] = useState(5); // 5 Years default
  const [tenureType, setTenureType] = useState("years"); // "years" or "months"

  const [scheduleView, setScheduleView] = useState("yearly"); // "yearly" or "monthly"

  const calculations = useMemo(() => {
    const P = Number(principal);
    const annualRate = Number(interestRate);
    const t = Number(tenure);

    const totalMonths = tenureType === "years" ? t * 12 : t;
    
    if (P <= 0 || annualRate <= 0 || totalMonths <= 0) {
      return {
        emi: 0,
        totalPayment: 0,
        totalInterest: 0,
        schedule: []
      };
    }

    const r = annualRate / 12 / 100; // monthly interest rate
    
    const emi = (P * r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1);
    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - P;

    let balance = P;
    const monthlyDetails = [];
    
    for (let month = 1; month <= totalMonths; month++) {
      const interestPaid = balance * r;
      const principalPaid = emi - interestPaid;
      const openingBalance = balance;
      balance = Math.max(0, balance - principalPaid);

      monthlyDetails.push({
        month,
        openingBalance,
        emi,
        interestPaid,
        principalPaid,
        closingBalance: balance
      });
    }

    const yearlyDetails = [];
    if (tenureType === "years" || totalMonths >= 12) {
      let year = 1;
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      let openingBalance = P;

      monthlyDetails.forEach((m, idx) => {
        yearlyPrincipal += m.principalPaid;
        yearlyInterest += m.interestPaid;

        if ((idx + 1) % 12 === 0 || idx + 1 === totalMonths) {
          const closingBalance = m.closingBalance;
          yearlyDetails.push({
            year,
            openingBalance,
            emi: yearlyPrincipal + yearlyInterest,
            principalPaid: yearlyPrincipal,
            interestPaid: yearlyInterest,
            closingBalance
          });
          year++;
          openingBalance = closingBalance;
          yearlyPrincipal = 0;
          yearlyInterest = 0;
        }
      });
    }

    return {
      emi: isFinite(emi) ? emi : 0,
      totalPayment: isFinite(totalPayment) ? totalPayment : 0,
      totalInterest: isFinite(totalInterest) ? totalInterest : 0,
      monthlyDetails,
      yearlyDetails
    };
  }, [principal, interestRate, tenure, tenureType]);

  const { emi, totalPayment, totalInterest, monthlyDetails, yearlyDetails } = calculations;

  const chartData = useMemo(() => {
    return [
      { name: "Principal Amount", value: Number(principal), color: "#6366f1" }, // Indigo
      { name: "Total Interest", value: Math.round(totalInterest), color: "#a855f7" } // Purple
    ];
  }, [principal, totalInterest]);

  const formatCurrency = (val) => {
    return `₹${Math.round(val || 0).toLocaleString("en-IN")}`;
  };

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">
      {/* Animated Background Atmosphere */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-purple-600/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-indigo-600/10 blur-[150px] animate-pulse" />
      </div>

      {/* Sidebar */}
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
        {/* Header */}
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-3 md:p-6 mt-14 flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[#09101d] backdrop-blur-2xl px-4 py-4 md:px-5 md:py-4 shadow-lg flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Interactive EMI Calculator</h1>
              <p className="text-[11px] text-slate-400">Calculate monthly loan payments, view interest components, and plan repayment schedules.</p>
            </div>
          </motion.div>

          {/* Calculator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left Column: Sliders/Inputs (7 Cols) */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-7 flex flex-col gap-5"
            >
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-xl flex flex-col gap-6">
                <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-2.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Loan Parameters
                </h3>

                {/* Slider 1: Loan Amount */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs font-semibold text-slate-300">Principal Loan Amount</span>
                    <div className="relative w-full sm:w-auto">
                      <span className="absolute left-2.5 top-1.5 text-[10px] text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={principal}
                        min="10000"
                        max="100000000"
                        step="10000"
                        onChange={(e) => setPrincipal(Number(e.target.value))}
                        className="w-full sm:w-40 pl-5 pr-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-xs font-bold text-white text-right focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="20000000"
                    step="50000"
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>₹50K</span>
                    <span>₹50L</span>
                    <span>₹1 Cr</span>
                    <span>₹2 Cr</span>
                  </div>
                </div>

                {/* Slider 2: Interest Rate */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs font-semibold text-slate-300">Interest Rate (% p.a.)</span>
                    <div className="relative w-full sm:w-auto">
                      <input
                        type="number"
                        value={interestRate}
                        min="1"
                        max="35"
                        step="0.1"
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-full sm:w-24 pr-6 pl-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-xs font-bold text-white text-right focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="25"
                    step="0.05"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>3%</span>
                    <span>10%</span>
                    <span>18%</span>
                    <span>25%</span>
                  </div>
                </div>

                {/* Slider 3: Loan Tenure */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs font-semibold text-slate-300">Loan Tenure</span>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Switch Toggle Type */}
                      <div className="flex bg-slate-950 border border-white/10 rounded-lg p-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (tenureType === "months") {
                              setTenureType("years");
                              setTenure(Math.max(1, Math.round(tenure / 12)));
                            }
                          }}
                          className={`px-2.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                            tenureType === "years"
                              ? "bg-purple-600 text-white shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Yr
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (tenureType === "years") {
                              setTenureType("months");
                              setTenure(tenure * 12);
                            }
                          }}
                          className={`px-2.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                            tenureType === "months"
                              ? "bg-purple-600 text-white shadow-sm"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Mo
                        </button>
                      </div>

                      <div className="relative w-full sm:w-auto">
                        <input
                          type="number"
                          value={tenure}
                          min="1"
                          max={tenureType === "years" ? 40 : 480}
                          onChange={(e) => setTenure(Number(e.target.value))}
                          className="w-full sm:w-20 pr-7 pl-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-xs font-bold text-white text-right focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <span className="absolute right-2 top-1.5 text-[9px] text-slate-500 font-bold uppercase">
                          {tenureType === "years" ? "Yr" : "Mo"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={tenureType === "years" ? 30 : 360}
                    step="1"
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>1 {tenureType === "years" ? "Year" : "Month"}</span>
                    <span>{tenureType === "years" ? "15 Years" : "180 Months"}</span>
                    <span>{tenureType === "years" ? "30 Years" : "360 Months"}</span>
                  </div>
                </div>
              </div>

              {/* Informative Banner */}
              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 flex gap-3 text-slate-400">
                <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>How is this calculated?</strong> Equated Monthly Installment (EMI) is calculated using the formula: 
                  <span className="block italic text-purple-300 mt-1 font-mono text-center">
                    EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]
                  </span> 
                  Where <strong>P</strong> is Loan amount, <strong>r</strong> is monthly interest rate, and <strong>n</strong> is tenure in number of monthly installments.
                </p>
              </div>
            </motion.div>

            {/* Right Column: Chart + Breakdown Stats (5 Cols) */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-5 flex flex-col gap-4"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex flex-col justify-between shadow-md">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly Installment (EMI)</span>
                  <span className="text-xl font-black text-white mt-1 border-t border-white/5 pt-2">{formatCurrency(emi)}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex flex-col justify-between shadow-md">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Repayment Amount</span>
                  <span className="text-xl font-black text-indigo-300 mt-1 border-t border-white/5 pt-2">{formatCurrency(totalPayment)}</span>
                </div>
              </div>

              {/* Detailed Breakdown Card */}
              <div className="rounded-2xl border border-white/10 bg-[#0d1527]/85 p-5 backdrop-blur-xl shadow-lg flex flex-col gap-4">
                <h4 className="text-xs font-bold text-white tracking-wide border-b border-white/5 pb-2 uppercase text-center">
                  Breakdown Summary
                </h4>

                {/* Pie Chart Representation */}
                <div className="w-full h-44 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), ""]} 
                        contentStyle={{ backgroundColor: "#0b101b", borderColor: "#ffffff10", borderRadius: "10px", fontSize: "11px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Content */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Total Interest</span>
                    <span className="text-sm font-black text-purple-400">{((totalInterest / totalPayment) * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Breakdown Legend Details */}
                <div className="flex flex-col gap-2.5 mt-1 text-[11px] sm:text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      <span className="text-slate-400 font-medium">Principal Loan Amount</span>
                    </div>
                    <span className="font-bold text-white">{formatCurrency(principal)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      <span className="text-slate-400 font-medium">Total Interest Payable</span>
                    </div>
                    <span className="font-bold text-purple-400">{formatCurrency(totalInterest)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <span className="text-slate-200 font-bold">Total Payable Cost</span>
                    <span className="font-black text-indigo-300">{formatCurrency(totalPayment)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Amortization Schedule Table */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-3 mt-3"
          >
            {/* Header controls for schedule */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/40 p-3 rounded-xl border border-white/5 backdrop-blur-md gap-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Amortization / Repayment Schedule
              </span>

              {/* Schedule View Toggle buttons */}
              <div className="flex bg-slate-950 border border-white/10 rounded-lg p-0.5 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={() => setScheduleView("yearly")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all w-1/2 sm:w-auto text-center ${
                    scheduleView === "yearly"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Yearly Details
                </button>
                <button
                  onClick={() => setScheduleView("monthly")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all w-1/2 sm:w-auto text-center ${
                    scheduleView === "monthly"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Monthly Details
                </button>
              </div>
            </div>

            {/* Amortization Schedule Table container */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-xl max-h-[400px] overflow-y-auto p-1 md:p-0">
              
              {/* Desktop/Tablet View: Table Layout */}
              <div className="hidden md:block">
                {scheduleView === "yearly" && (yearlyDetails && yearlyDetails.length > 0) ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-950/70 text-[9px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 backdrop-blur-xl">
                        <th className="py-3 px-4">Year</th>
                        <th className="py-3 px-4">Opening Balance</th>
                        <th className="py-3 px-4">EMI Paid (Yearly)</th>
                        <th className="py-3 px-4 text-indigo-400">Principal Component</th>
                        <th className="py-3 px-4 text-purple-400">Interest Component</th>
                        <th className="py-3 px-4 text-right">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {yearlyDetails.map((y) => (
                        <tr key={y.year} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-bold text-white">Year {y.year}</td>
                          <td className="py-3 px-4 text-slate-400">{formatCurrency(y.openingBalance)}</td>
                          <td className="py-3 px-4 text-slate-300 font-semibold">{formatCurrency(y.emi)}</td>
                          <td className="py-3 px-4 text-indigo-300 font-bold">{formatCurrency(y.principalPaid)}</td>
                          <td className="py-3 px-4 text-purple-300 font-bold">{formatCurrency(y.interestPaid)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatCurrency(y.closingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : scheduleView === "monthly" && (monthlyDetails && monthlyDetails.length > 0) ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-950/70 text-[9px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 backdrop-blur-xl">
                        <th className="py-3 px-4">Month</th>
                        <th className="py-3 px-4">Opening Balance</th>
                        <th className="py-3 px-4">EMI Installment</th>
                        <th className="py-3 px-4 text-indigo-400">Principal Repaid</th>
                        <th className="py-3 px-4 text-purple-400">Interest Paid</th>
                        <th className="py-3 px-4 text-right">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {monthlyDetails.map((m) => (
                        <tr key={m.month} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-4 font-bold text-white">Month {m.month}</td>
                          <td className="py-2.5 px-4 text-slate-400">{formatCurrency(m.openingBalance)}</td>
                          <td className="py-2.5 px-4 text-slate-300 font-semibold">{formatCurrency(m.emi)}</td>
                          <td className="py-2.5 px-4 text-indigo-300">{formatCurrency(m.principalPaid)}</td>
                          <td className="py-2.5 px-4 text-purple-300">{formatCurrency(m.interestPaid)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-400">{formatCurrency(m.closingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>

              {/* Mobile View: Premium Stacked Cards Layout */}
              <div className="md:hidden flex flex-col gap-3 p-2">
                {scheduleView === "yearly" && (yearlyDetails && yearlyDetails.length > 0) ? (
                  yearlyDetails.map((y) => (
                    <div key={y.year} className="bg-slate-950/50 border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-md">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-bold text-white text-xs">Year {y.year}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-slate-500 uppercase font-bold">Closing Balance</span>
                          <span className="font-extrabold text-emerald-400 text-xs">{formatCurrency(y.closingBalance)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="block text-slate-500 font-bold uppercase text-[9px] tracking-wide">Opening Balance</span>
                          <span className="font-semibold text-slate-300">{formatCurrency(y.openingBalance)}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 font-bold uppercase text-[9px] tracking-wide">EMI Paid (Yearly)</span>
                          <span className="font-semibold text-slate-300">{formatCurrency(y.emi)}</span>
                        </div>
                        <div>
                          <span className="block text-indigo-400/80 font-bold uppercase text-[9px] tracking-wide">Principal Paid</span>
                          <span className="font-bold text-indigo-300">{formatCurrency(y.principalPaid)}</span>
                        </div>
                        <div>
                          <span className="block text-purple-400/80 font-bold uppercase text-[9px] tracking-wide">Interest Paid</span>
                          <span className="font-bold text-purple-300">{formatCurrency(y.interestPaid)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : scheduleView === "monthly" && (monthlyDetails && monthlyDetails.length > 0) ? (
                  monthlyDetails.map((m) => (
                    <div key={m.month} className="bg-slate-950/50 border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-md">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-bold text-white text-xs">Month {m.month}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-slate-500 uppercase font-bold">Closing Balance</span>
                          <span className="font-extrabold text-emerald-400 text-xs">{formatCurrency(m.closingBalance)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="block text-slate-500 font-bold uppercase text-[9px] tracking-wide">Opening Balance</span>
                          <span className="font-semibold text-slate-300">{formatCurrency(m.openingBalance)}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 font-bold uppercase text-[9px] tracking-wide">EMI Installment</span>
                          <span className="font-semibold text-slate-300">{formatCurrency(m.emi)}</span>
                        </div>
                        <div>
                          <span className="block text-indigo-400/80 font-bold uppercase text-[9px] tracking-wide">Principal Repaid</span>
                          <span className="font-bold text-indigo-300">{formatCurrency(m.principalPaid)}</span>
                        </div>
                        <div>
                          <span className="block text-purple-400/80 font-bold uppercase text-[9px] tracking-wide">Interest Paid</span>
                          <span className="font-bold text-purple-300">{formatCurrency(m.interestPaid)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : null}
              </div>

              {/* No Data State */}
              {(!yearlyDetails || yearlyDetails.length === 0) && (!monthlyDetails || monthlyDetails.length === 0) && (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  Set input values above to view repayment schedule
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
