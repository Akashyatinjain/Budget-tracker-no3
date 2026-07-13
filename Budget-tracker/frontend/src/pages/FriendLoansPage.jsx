import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  fetchFriendLoans,
  addFriendLoan,
  updateFriendLoan,
  deleteFriendLoan
} from "../store/friendLoanSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, DollarSign, Users, Calendar, Clock,
  CheckCircle2, AlertCircle, Search, Sparkles, Filter,
  X, Check, ArrowRightLeft, FileText
} from "lucide-react";

export default function FriendLoansPage() {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const { items: reduxLoans, loading: reduxLoading, error: reduxError } = useSelector((state) => state.friendLoans);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isReturned, setIsReturned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'returned'

  const fetchLoans = () => {
    dispatch(fetchFriendLoans());
  };

  useEffect(() => {
    document.title = "Friend Loans | FinTrack Budget Tracker";
    if (token) {
      dispatch(fetchFriendLoans());
    }
  }, [token, dispatch]);

  useEffect(() => {
    setLoans(reduxLoans);
    setLoading(reduxLoading);
    setError(reduxError || "");
  }, [reduxLoans, reduxLoading, reduxError]);

  const handleAddLoan = async (e) => {
    e.preventDefault();
    if (!friendName.trim()) {
      toast.error("Please enter your friend's name");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!loanDate) {
      toast.error("Please select a date");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        friend_name: friendName,
        amount: Number(amount),
        loan_date: loanDate,
        notes: notes,
        is_returned: isReturned
      };

      await dispatch(addFriendLoan(payload)).unwrap();
      toast.success("✨ Friend loan record added successfully!");
      setShowModal(false);
      setFriendName("");
      setAmount("");
      setLoanDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setIsReturned(false);
      dispatch(fetchFriendLoans());
    } catch (err) {
      console.error("Error adding loan:", err);
      toast.error(err || "Failed to add friend loan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (loan) => {
    try {
      const updatedStatus = !loan.is_returned;
      await dispatch(updateFriendLoan({
        id: loan.loan_id,
        data: { is_returned: updatedStatus }
      })).unwrap();
      
      toast.success(
        updatedStatus 
          ? `🎉 Marked as returned from ${loan.friend_name}!` 
          : `⚠️ Marked as pending for ${loan.friend_name}`
      );
      
      dispatch(fetchFriendLoans());
    } catch (err) {
      console.error("Error toggling status:", err);
      toast.error(err || "Failed to update status.");
    }
  };

  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm("Are you sure you want to delete this loan record?")) {
      return;
    }
    try {
      await dispatch(deleteFriendLoan(loanId)).unwrap();
      toast.success("Entry removed");
      dispatch(fetchFriendLoans());
    } catch (err) {
      console.error("Error deleting loan:", err);
      toast.error(err || "Failed to delete loan entry.");
    }
  };

  const stats = React.useMemo(() => {
    const totalLent = loans.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalReturned = loans
      .filter((item) => item.is_returned)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const totalOwed = totalLent - totalReturned;
    const pendingCount = loans.filter((item) => !item.is_returned).length;

    return { totalLent, totalReturned, totalOwed, pendingCount };
  }, [loans]);

  const filteredLoans = React.useMemo(() => {
    return loans.filter((item) => {
      const matchesSearch = item.friend_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) || 
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "returned" && item.is_returned) ||
        (statusFilter === "pending" && !item.is_returned);

      return matchesSearch && matchesStatus;
    });
  }, [loans, searchTerm, statusFilter]);

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
  };

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen || showModal ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileSidebarOpen, showModal]);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030712] text-white">
      {/* Animated Background Atmosphere */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-purple-600/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-120px] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" />
      </div>

      {/* Sidebar Component */}
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header Component */}
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
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Friend Loans Tracker</h1>
                <p className="text-[11px] text-slate-400">Keep track of money lent to friends, when it was lent, and who returned what.</p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-400 px-4 py-2 font-semibold text-xs text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={14} />
              Record Lent Money
            </button>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {/* Total Lent Card */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur-xl hover:border-slate-800 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Amount Lent</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{formatCurrency(stats.totalLent)}</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Cumulative money lent to friends</p>
            </motion.div>

            {/* Total Owed Card (Pending) */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur-xl hover:border-slate-800 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Pending Recovery</p>
                  <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{formatCurrency(stats.totalOwed)}</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <p className="text-[10px] text-amber-500/80 mt-2 font-medium">
                {stats.pendingCount} unpaid {stats.pendingCount === 1 ? "loan" : "loans"} outstanding
              </p>
            </motion.div>

            {/* Total Returned Card */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur-xl hover:border-slate-800 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Recovered (Returned)</p>
                  <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{formatCurrency(stats.totalReturned)}</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Recovered successfully back to wallet</p>
            </motion.div>
          </motion.div>

          {/* Filters & Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Control Bar: Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-white/5 backdrop-blur-md">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by friend name or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto self-start sm:self-auto py-1">
                <span className="text-[11px] text-slate-400 font-semibold mr-1.5 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    statusFilter === "all"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-slate-950/70 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  All Entries
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                    statusFilter === "pending"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-950/70 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter("returned")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                    statusFilter === "returned"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-950/70 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Returned
                </button>
              </div>
            </div>

            {/* List / Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 border border-white/5 bg-slate-900/20 rounded-2xl backdrop-blur-xl">
                <div className="relative w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-xs text-slate-400 mt-4 animate-pulse">Retrieving loan logs...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 border border-rose-500/10 bg-rose-500/5 rounded-2xl text-center px-4">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <h4 className="text-sm font-semibold text-rose-200 mt-3">An Error Occurred</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">{error}</p>
                <button 
                  onClick={fetchLoans}
                  className="mt-4 px-4 py-1.5 bg-slate-800 text-xs rounded-xl hover:bg-slate-700 transition-all font-semibold"
                >
                  Retry Load
                </button>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-white/10 bg-slate-900/20 rounded-2xl text-center px-4 backdrop-blur-xl">
                <div className="p-4 bg-slate-800/40 rounded-full text-slate-500 mb-4 border border-white/5">
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {searchTerm || statusFilter !== "all" ? "No matches found" : "No friend loans found"}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search criteria or resetting your status filters."
                    : "Lend money to a friend? Record it here to keep track of amounts, dates, and repayments."}
                </p>
                {!(searchTerm || statusFilter !== "all") && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 rounded-xl bg-purple-600 px-4 py-2 font-semibold text-xs text-white hover:bg-purple-500 transition-all flex items-center gap-1.5"
                  >
                    <Plus size={12} />
                    Add Friend Loan
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-xl shadow-xl">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-950/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-3.5 px-4">Date Lent</th>
                      <th className="py-3.5 px-4">Friend Name</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Notes</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLoans.map((loan) => (
                      <motion.tr
                        key={loan.loan_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Date */}
                        <td className="py-3 px-4 text-slate-300 font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {formatDate(loan.loan_date)}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-inner">
                              {loan.friend_name.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{loan.friend_name}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4">
                          <span className={`font-bold text-sm ${loan.is_returned ? 'text-slate-400 line-through' : 'text-purple-300'}`}>
                            {formatCurrency(loan.amount)}
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="py-3 px-4 max-w-xs text-slate-400 font-normal truncate">
                          {loan.notes ? (
                            <div className="flex items-center gap-1.5" title={loan.notes}>
                              <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{loan.notes}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600 italic">No notes</span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleStatus(loan)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border transition-all hover:scale-[1.03] cursor-pointer ${
                                loan.is_returned
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              }`}
                            >
                              {loan.is_returned ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Returned</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Pending</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(loan)}
                              title={loan.is_returned ? "Mark as Pending" : "Mark as Returned"}
                              className={`p-1.5 rounded-lg border hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                loan.is_returned 
                                  ? "text-slate-400 hover:text-amber-400 border-white/10 hover:border-amber-400/20 hover:bg-amber-400/5" 
                                  : "text-emerald-400 border-emerald-400/10 hover:border-emerald-400/30 hover:bg-emerald-400/10"
                              }`}
                            >
                              {loan.is_returned ? <Clock size={14} /> : <Check size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteLoan(loan.loan_id)}
                              title="Delete entry"
                              className="p-1.5 text-rose-400 rounded-lg border border-rose-400/10 hover:border-rose-400/30 hover:bg-rose-500/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Record Loan Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-[#0b101b] p-5 shadow-2xl z-10 text-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Record Friend Loan</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddLoan} className="mt-4 flex flex-col gap-4">
                {/* Friend Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Friend Name</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul, John"
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount (₹)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lent Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                    <input
                      type="date"
                      required
                      value={loanDate}
                      onChange={(e) => setLoanDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes / Reason (Optional)</label>
                  <textarea
                    placeholder="e.g. For dinner, movie ticket, cab booking..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                {/* Already Returned? Checkbox */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="isReturned"
                    checked={isReturned}
                    onChange={(e) => setIsReturned(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-600 bg-slate-950 border-white/10 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isReturned" className="text-xs text-slate-300 font-medium select-none cursor-pointer">
                    This friend has already returned this money
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2.5 mt-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Log"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
