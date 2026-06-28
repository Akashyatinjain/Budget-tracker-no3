// TrendsPage.jsx - FinTrack Theme
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
  FiTrendingUp,
  FiTrendingDown,
  FiZap,
  FiShield,
  FiClock,
  FiDownload,
  FiPieChart,
  FiBarChart2,
  FiDollarSign
} from "react-icons/fi";

const TrendsPage = () => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [timeRange, setTimeRange] = useState("month");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 1, name: "Food & Dining", color: "#10b981" },
    { id: 2, name: "Shopping", color: "#8b5cf6" },
    { id: 3, name: "Transportation", color: "#06b6d4" },
    { id: 4, name: "Entertainment", color: "#eab308" },
    { id: 5, name: "Bills & Utilities", color: "#14b8a6" },
    { id: 6, name: "Healthcare", color: "#ef4444" },
    { id: 7, name: "Salary", color: "#22c55e" },
    { id: 8, name: "Investment", color: "#3b82f6" },
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
      suggestions.push(`Your spending on ${insights.mostSpentCategory.name} is ${insights.mostSpentCategory.percentage}% of total expenses. Consider diversifying your spending.`);
    }
    
    if (insights.savingsGrowth < 0) {
      suggestions.push("Your savings decreased this month. Review your recent expenses to identify areas for improvement.");
    }
    
    if (insights.topGrowingCategory && insights.topGrowingCategory.growth > 50) {
      suggestions.push(`Your ${insights.topGrowingCategory.name} spending grew by ${insights.topGrowingCategory.growth}%. Make sure this aligns with your budget goals.`);
    }

    if (chartData.length > 0) {
      const currentData = chartData[chartData.length - 1];
      const subscriptionExpense = currentData["Bills & Utilities"] || 0;
      if (subscriptionExpense > 1000) {
        suggestions.push(`You're spending ₹${subscriptionExpense} on subscriptions. Review recurring payments to optimize costs.`);
      }
    }

    if (suggestions.length === 0) {
      if (chartData.length === 0) {
        suggestions.push("Start adding transactions to see personalized insights and trends.");
      } else if (insights.currentSavings > 0) {
        suggestions.push("Your financial trends look healthy! Keep monitoring your spending patterns.");
      } else {
        suggestions.push("Track your income and expenses regularly to build better financial habits.");
      }
    }

    return suggestions;
  };

  const aiSuggestions = generateAISuggestions();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111118] border border-white/10 p-3 rounded-xl shadow-lg">
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
      const filename = `budget-report-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;
      downloadBlob(res.data, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
      toast.success("Excel report downloaded!");
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
      const filename = `budget-report-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
      downloadBlob(res.data, "application/pdf", filename);
      toast.success("PDF report downloaded!");
    } catch (err) {
      console.error("Export PDF error:", err);
      toast.error("Failed to export PDF report.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
        <AdvancedSidebar
          user={user}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-3 text-emerald-400"
          >
            <FiTrendingUp className="w-6 h-6" />
            <span>Loading trends...</span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-gray-100">
      <AdvancedSidebar
        user={user}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        <main className="p-4 md:p-6 mt-16 flex flex-col gap-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0"
          >
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Financial Trends</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  <FiZap className="w-3 h-3" />
                  AI Insights Active
                </span>
              </div>
              <p className="text-gray-400 text-sm">Visualize your spending, income, and savings patterns</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last 6 Months</option>
                <option value="year">This Year</option>
              </select>
            </div>
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
                <FiTrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Trend Analysis</p>
                <p className="text-xs text-gray-400">
                  {chartData.length > 0 
                    ? `Monthly average income: ₹${insights.averageIncome.toLocaleString('en-IN')} · Expenses: ₹${insights.averageExpenses.toLocaleString('en-IN')}`
                    : 'Add transactions to see trend analysis'}
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
                Real-time
              </span>
            </div>
          </motion.div>

          {/* Overview Cards - FinTrack Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Top Growing Category",
                value: insights.topGrowingCategory.name,
                subtitle: `${insights.topGrowingCategory.growth > 0 ? '+' : ''}${insights.topGrowingCategory.growth}% from last month`,
                icon: FiTrendingUp,
                color: "text-emerald-400",
                bgColor: "bg-emerald-500/20"
              },
              {
                title: "Most Spent Category",
                value: insights.mostSpentCategory.name,
                subtitle: `₹${insights.mostSpentCategory.amount.toLocaleString('en-IN')} (${insights.mostSpentCategory.percentage}% of expenses)`,
                icon: FiDollarSign,
                color: "text-rose-400",
                bgColor: "bg-rose-500/20"
              },
              {
                title: "Savings Trend",
                value: `${insights.savingsGrowth > 0 ? '+' : ''}${insights.savingsGrowth}%`,
                subtitle: `Current savings: ₹${insights.currentSavings.toLocaleString('en-IN')}`,
                icon: FiBarChart2,
                color: insights.savingsGrowth >= 0 ? "text-emerald-400" : "text-rose-400",
                bgColor: insights.savingsGrowth >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
              }
            ].map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${card.bgColor} rounded-lg`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{card.title}</p>
                    <h3 className={`text-lg font-semibold ${card.color}`}>
                      {card.value}
                    </h3>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Income vs Expense Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-6">
              <FiTrendingUp className="text-emerald-400 w-5 h-5" />
              <h3 className="text-lg font-semibold text-white">Income vs Expenses</h3>
            </div>
            <div className="h-[22rem] sm:h-[20rem] md:h-[24rem]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="month"
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      tickFormatter={(value) =>
                        value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value
                      }
                      domain={[0, "auto"]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af", paddingTop: "5px" }} />
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10B981"
                      fill="url(#colorIncome)"
                      strokeWidth={2}
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#EF4444"
                      fill="url(#colorExpenses)"
                      strokeWidth={2}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No data available for the selected period
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Savings Growth Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-6">
                <FiBarChart2 className="text-emerald-400 w-5 h-5" />
                <h3 className="text-lg font-semibold text-white">Savings Growth</h3>
              </div>
              <div className="h-[22rem] sm:h-[20rem] md:h-[24rem]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="month"
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        tickFormatter={(value) =>
                          value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value
                        }
                        domain={[0, "auto"]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af", paddingTop: "5px" }} />
                      <defs>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Line
                        type="monotone"
                        dataKey="savings"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#0a0a0f" }}
                        activeDot={{ r: 6, fill: "#60A5FA" }}
                        name="Savings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No savings data available
                  </div>
                )}
              </div>
            </motion.div>

            {/* Category Trend Comparison */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-6">
                <FiPieChart className="text-emerald-400 w-5 h-5" />
                <h3 className="text-lg font-semibold text-white">Category Breakdown</h3>
              </div>
              <div className="h-[25rem] sm:h-[22rem] md:h-[24rem]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="month"
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        tickFormatter={(value) =>
                          value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af", paddingTop: "5px" }} />
                      <Bar dataKey="Food & Dining" stackId="a" fill="#10b981" name="Food & Dining" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Shopping" stackId="a" fill="#8b5cf6" name="Shopping" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Transportation" stackId="a" fill="#06b6d4" name="Transportation" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Bills & Utilities" stackId="a" fill="#14b8a6" name="Bills & Utilities" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Investment" stackId="a" fill="#3b82f6" name="Investment" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No category data available
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* AI Insights & Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <FiZap className="text-emerald-400 w-5 h-5" />
              <h3 className="text-lg font-semibold text-white">💡 AI Insights & Suggestions</h3>
            </div>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10"
                >
                  <span className="text-emerald-400 mt-0.5">💭</span>
                  <p className="text-gray-300 text-sm">{suggestion}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Export Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={exportExcel}
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-all duration-200 flex items-center gap-2 text-sm"
            >
              <FiDownload className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={exportPDF}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm"
            >
              <FiDownload className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrendsPage;