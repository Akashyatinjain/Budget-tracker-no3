// TrendsPage.jsx - FinTrack Unified Design System
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";
import { useAuth, api } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Clock,
  Download,
  PieChart as PieChartIcon,
  BarChart3,
  DollarSign,
  Sparkles,
  Brain,
  Lightbulb,
  FileSpreadsheet,
  FileOutput,
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
  Layers,
  Eye
} from "lucide-react";

const TrendsPage = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [timeRange, setTimeRange] = useState("month");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 1, name: "Food & Dining",    color: "#f43f5e", icon: "🍕" },
    { id: 2, name: "Shopping",         color: "#8b5cf6", icon: "🛍️" },
    { id: 3, name: "Transportation",   color: "#06b6d4", icon: "🚗" },
    { id: 4, name: "Entertainment",    color: "#f59e0b", icon: "🎬" },
    { id: 5, name: "Bills & Utilities",color: "#84cc16", icon: "💡" },
    { id: 6, name: "Healthcare",       color: "#ef4444", icon: "🏥" },
    { id: 7, name: "Salary",           color: "#22c55e", icon: "💰" },
    { id: 8, name: "Investment",       color: "#3b82f6", icon: "📈" },
  ];

  const getCategoryName = (id) => {
    const cat = categories.find((c) => parseInt(c.id) === parseInt(id));
    return cat ? cat.name : "Unknown";
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [mobileSidebarOpen]);

  const fetchTransactions = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/api/transactions");
      const data = res.data.transactions || res.data;
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = () => {
    if (!transactions.length) return [];

    const now = new Date();
    let months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        timestamp: date.getTime()
      });
    }

    return months.map(({ month, timestamp }) => {
      const monthStart = new Date(timestamp);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        if (!t.transaction_date) return false;
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const expenses = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const savings = income - expenses;

      const categoryExpenses = {};
      categories.forEach(cat => {
        categoryExpenses[cat.name] = monthTransactions
          .filter(t => parseInt(t.category_id) === cat.id && t.type === "expense")
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      });

      return {
        month,
        income: Math.round(income),
        expenses: Math.round(expenses),
        savings: Math.round(savings),
        ...categoryExpenses
      };
    });
  };

  const chartData = processChartData();

  const calculateInsights = () => {
    const defaultInsights = {
      topGrowingCategory: { name: "No data", growth: 0 },
      mostSpentCategory: { name: "No data", amount: 0, percentage: 0 },
      savingsGrowth: 0,
      currentSavings: 0,
      averageIncome: 0,
      averageExpenses: 0
    };

    if (chartData.length < 2) {
      if (chartData.length === 1) {
        const current = chartData[0];
        let mostSpentCategory = { name: "No data", amount: 0, percentage: 0 };
        
        categories.forEach(cat => {
          const amount = current[cat.name] || 0;
          if (amount > mostSpentCategory.amount) {
            mostSpentCategory = { 
              name: cat.name, 
              amount: Math.round(amount), 
              percentage: current.expenses > 0 ? Math.round((amount / current.expenses) * 100) : 0 
            };
          }
        });

        return {
          ...defaultInsights,
          mostSpentCategory,
          currentSavings: current.savings,
          averageIncome: current.income,
          averageExpenses: current.expenses
        };
      }
      return defaultInsights;
    }

    const current = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];

    let topGrowingCategory = { name: "No significant growth", growth: 0 };
    categories.forEach(cat => {
      const currentAmount = current[cat.name] || 0;
      const previousAmount = previous[cat.name] || 0;
      const growth = previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : 0;
      
      if (growth > topGrowingCategory.growth && Math.abs(growth) > 5) {
        topGrowingCategory = { name: cat.name, growth: Math.round(growth) };
      }
    });

    let mostSpentCategory = { name: "No expenses", amount: 0, percentage: 0 };
    const totalExpenses = current.expenses;
    
    if (totalExpenses > 0) {
      categories.forEach(cat => {
        const amount = current[cat.name] || 0;
        const percentage = (amount / totalExpenses) * 100;
        
        if (amount > mostSpentCategory.amount) {
          mostSpentCategory = { 
            name: cat.name, 
            amount: Math.round(amount), 
            percentage: Math.round(percentage) 
          };
        }
      });
    }

    let savingsGrowth = 0;
    if (previous.savings !== 0) {
      savingsGrowth = ((current.savings - previous.savings) / Math.abs(previous.savings)) * 100;
    } else if (current.savings > 0) {
      savingsGrowth = 100;
    }

    const averageIncome = chartData.reduce((sum, d) => sum + d.income, 0) / chartData.length;
    const averageExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0) / chartData.length;

    return {
      topGrowingCategory,
      mostSpentCategory,
      savingsGrowth: Math.round(savingsGrowth),
      currentSavings: current.savings,
      averageIncome: Math.round(averageIncome),
      averageExpenses: Math.round(averageExpenses)
    };
  };

  const insights = calculateInsights();

  const generateAISuggestions = () => {
    const suggestions = [];
    
    if (insights.mostSpentCategory && insights.mostSpentCategory.percentage > 40) {
      suggestions.push({
        text: `Your spending on ${insights.mostSpentCategory.name} is ${insights.mostSpentCategory.percentage}% of total expenses. Consider diversifying your spending.`,
        type: "warning"
      });
    }
    
    if (insights.savingsGrowth < 0) {
      suggestions.push({
        text: "Your savings decreased this month. Review your recent expenses to identify areas for improvement.",
        type: "warning"
      });
    }
    
    if (insights.topGrowingCategory && insights.topGrowingCategory.growth > 50) {
      suggestions.push({
        text: `Your ${insights.topGrowingCategory.name} spending grew by ${insights.topGrowingCategory.growth}%. Make sure this aligns with your budget goals.`,
        type: "info"
      });
    }

    if (chartData.length > 0) {
      const currentData = chartData[chartData.length - 1];
      const subscriptionExpense = currentData["Bills & Utilities"] || 0;
      if (subscriptionExpense > 1000) {
        suggestions.push({
          text: `You're spending ₹${subscriptionExpense} on subscriptions. Review recurring payments to optimize costs.`,
          type: "tip"
        });
      }
    }

    if (suggestions.length === 0) {
      if (chartData.length === 0) {
        suggestions.push({
          text: "Start adding transactions to see personalized insights and trends.",
          type: "info"
        });
      } else if (insights.currentSavings > 0) {
        suggestions.push({
          text: "Your financial trends look healthy! Keep monitoring your spending patterns.",
          type: "success"
        });
      } else {
        suggestions.push({
          text: "Track your income and expenses regularly to build better financial habits.",
          type: "info"
        });
      }
    }

    return suggestions;
  };

  const aiSuggestions = generateAISuggestions();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d141a] border border-[#2a333d] p-3 rounded-xl shadow-lg">
          <p className="text-white font-semibold text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₹{entry.value?.toLocaleString('en-IN') || 0}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const downloadBlob = (data, mimeType, filename) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/reports/export/excel", {
        responseType: "arraybuffer",
      });
      const filename = `trends-report-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
      downloadBlob(res.data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
      toast.success("📊 Excel report downloaded!");
    } catch (err) {
      console.error("Export Excel error:", err);
      toast.error("Failed to export Excel report.");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/reports/export/pdf", {
        responseType: "arraybuffer",
      });
      const filename = `trends-report-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
      downloadBlob(res.data, "application/pdf", filename);
      toast.success("📄 PDF report downloaded!");
    } catch (err) {
      console.error("Export PDF error:", err);
      toast.error("Failed to export PDF report.");
    } finally {
      setLoading(false);
    }
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

  // ====== Insight Cards Data ======
  const insightCards = [
    {
      title: "Top Growing Category",
      value: insights.topGrowingCategory.name,
      subtitle: `${insights.topGrowingCategory.growth > 0 ? '+' : ''}${insights.topGrowingCategory.growth}% from last month`,
      icon: TrendingUp,
      color: "from-emerald-400 to-teal-300",
      trend: insights.topGrowingCategory.growth >= 0 ? "up" : "down",
      bg: "from-emerald-500/10 to-teal-500/5"
    },
    {
      title: "Most Spent Category",
      value: insights.mostSpentCategory.name,
      subtitle: `₹${insights.mostSpentCategory.amount.toLocaleString('en-IN')} (${insights.mostSpentCategory.percentage}% of expenses)`,
      icon: DollarSign,
      color: "from-rose-400 to-red-300",
      trend: "down",
      bg: "from-rose-500/10 to-red-500/5"
    },
    {
      title: "Savings Trend",
      value: `${insights.savingsGrowth > 0 ? '+' : ''}${insights.savingsGrowth}%`,
      subtitle: `Current savings: ₹${insights.currentSavings.toLocaleString('en-IN')}`,
      icon: Target,
      color: insights.savingsGrowth >= 0 ? "from-emerald-400 to-teal-300" : "from-rose-400 to-red-300",
      trend: insights.savingsGrowth >= 0 ? "up" : "down",
      bg: insights.savingsGrowth >= 0 ? "from-emerald-500/10 to-teal-500/5" : "from-rose-500/10 to-red-500/5"
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
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Financial Trends</h1>
                <p className="text-xs text-slate-400">Visualize spending, income &amp; savings patterns.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
              >
                <option value="week" className="bg-[#0d141a]">Last 7 Days</option>
                <option value="month" className="bg-[#0d141a]">Last Month</option>
                <option value="quarter" className="bg-[#0d141a]">Last 6 Months</option>
                <option value="year" className="bg-[#0d141a]">This Year</option>
              </select>
            </div>
          </motion.div>

          {/* ====== Trend Summary Banner ====== */}
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
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Trend Analysis</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {chartData.length > 0 
                      ? <>Monthly avg: <span className="text-emerald-400 font-medium">₹{insights.averageIncome.toLocaleString('en-IN')}</span> income · <span className="text-rose-400 font-medium">₹{insights.averageExpenses.toLocaleString('en-IN')}</span> expenses</>
                      : 'Add transactions to see trend analysis'}
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
                  Real-time
                </span>
              </div>
            </div>
          </motion.div>

          {/* ====== Insight Cards ====== */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {insightCards.map((card, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${card.bg} border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 group`}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} bg-opacity-10 shadow-lg`}>
                      <card.icon className={`w-5 h-5 ${
                        card.trend === "up" ? "text-emerald-400" : "text-rose-400"
                      }`} />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">{card.title}</p>
                  </div>
                  <h3 className={`text-xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent mb-1`}>
                    {card.value}
                  </h3>
                  <p className="text-xs text-slate-500">{card.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ====== Income vs Expense Area Chart ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Income vs Expenses</h3>
              <span className="ml-auto text-xs text-slate-500 bg-[#1a2228] px-3 py-1 rounded-full">6 Month Trend</span>
            </div>
            <div className="h-[25rem] sm:h-[22rem] md:h-[26rem]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#4a5a6a"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#4a5a6a"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                      domain={[0, "auto"]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <defs>
                      <linearGradient id="colorIncomeTrends" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpensesTrends" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#22c55e"
                      fill="url(#colorIncomeTrends)"
                      strokeWidth={3}
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      fill="url(#colorExpensesTrends)"
                      strokeWidth={3}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No data available for the selected period</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ====== Bottom Charts Row ====== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Savings Growth Line Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Savings Growth</h3>
              </div>
              <div className="h-[25rem] sm:h-[22rem] md:h-[24rem]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#4a5a6a"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#4a5a6a"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                        domain={[0, "auto"]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                      <Line
                        type="monotone"
                        dataKey="savings"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#0a0e12" }}
                        activeDot={{ r: 7, fill: "#60a5fa", strokeWidth: 2, stroke: "#0a0e12" }}
                        name="Savings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Target className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No savings data available</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Category Breakdown Stacked Bar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400/20 to-violet-400/20">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Category Breakdown</h3>
              </div>
              <div className="h-[27rem] sm:h-[24rem] md:h-[26rem]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a252f" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#4a5a6a"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#4a5a6a"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                      <Bar dataKey="Food & Dining"    stackId="a" fill="#f43f5e" name="Food & Dining"    radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Shopping"         stackId="a" fill="#8b5cf6" name="Shopping"         radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Transportation"   stackId="a" fill="#06b6d4" name="Transportation"   radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Bills & Utilities" stackId="a" fill="#84cc16" name="Bills & Utilities" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Investment"       stackId="a" fill="#3b82f6" name="Investment"       radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Layers className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No category data available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ====== AI Insights & Suggestions ====== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-lg hover:border-emerald-500/20 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI Insights & Suggestions</h3>
              <span className="ml-auto text-xs text-slate-500 bg-[#1a2228] px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Powered by AI
              </span>
            </div>
            <div className="space-y-2.5">
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                    suggestion.type === "warning" 
                      ? "bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20" 
                      : suggestion.type === "success"
                      ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20"
                      : suggestion.type === "tip"
                      ? "bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20"
                      : "bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20"
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    suggestion.type === "warning" ? "bg-yellow-500/20" :
                    suggestion.type === "success" ? "bg-emerald-500/20" :
                    suggestion.type === "tip" ? "bg-blue-500/20" : "bg-purple-500/20"
                  }`}>
                    {suggestion.type === "warning" ? (
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                    ) : suggestion.type === "success" ? (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    ) : suggestion.type === "tip" ? (
                      <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{suggestion.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ====== Export Buttons ====== */}
          <div className="flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportExcel}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 hover:text-white hover:border-emerald-500/30 transition-all shadow-lg flex items-center gap-2"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportPDF}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400 px-5 py-3 font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/60 transition-all flex items-center gap-2"
            >
              <FileOutput size={16} />
              Export PDF
            </motion.button>
          </div>

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
      </div>
    </div>
  );
};

export default TrendsPage;