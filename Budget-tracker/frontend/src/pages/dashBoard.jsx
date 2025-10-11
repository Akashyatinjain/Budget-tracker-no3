import React, { useState } from "react";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";

const FinanceDashboard = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [transactions, setTransactions] = useState([
    { id: 1, name: "Grocery Shopping", amount: -85.5, category: "Food", date: "2024-01-15" },
    { id: 2, name: "Salary", amount: 2500.0, category: "Income", date: "2024-01-10" },
    { id: 3, name: "Netflix Subscription", amount: -15.99, category: "Entertainment", date: "2024-01-08" },
    { id: 4, name: "Electric Bill", amount: -120.75, category: "Utilities", date: "2024-01-05" },
    { id: 5, name: "Freelance Work", amount: 800.0, category: "Income", date: "2024-01-03" },
  ]);

  const summaryData = {
    balance: 3245.76,
    income: 3300.0,
    expenses: 1054.24,
    savingsGoal: 5000.0,
    alerts: 2,
  };

  const chartData = {
    expenseVsIncome: {
      income: 65,
      expenses: 35,
    },
    monthlyTrends: [
      { month: "Oct", income: 2800, expenses: 1200 },
      { month: "Nov", income: 3200, expenses: 1400 },
      { month: "Dec", income: 2900, expenses: 1300 },
      { month: "Jan", income: 3300, expenses: 1054 },
    ],
    categoryExpenses: [
      { category: "Food", amount: 320 },
      { category: "Utilities", amount: 280 },
      { category: "Entertainment", amount: 150 },
      { category: "Transport", amount: 180 },
      { category: "Shopping", amount: 124 },
    ],
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      {/* Sidebar */}
      <AdvancedSidebar
        user={{ name: "John Dice" }}
        role="user"
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <Header onMobileToggle={() => setMobileSidebarOpen(true)} />

        {/* Dashboard Content */}
        <main className="p-6 mt-16 bg-gradient-to-b from-[#1b0128] via-[#2e014d] to-[#3c0160] flex-1">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[
              { label: "Balance", value: summaryData.balance, color: "blue", icon: "M12 8c-1.657..." },
              { label: "Income", value: summaryData.income, color: "green", icon: "M12 8c-1.657..." },
              { label: "Expenses", value: summaryData.expenses, color: "red", icon: "M12 8c-1.657..." },
              {
                label: "Savings Goal",
                value: summaryData.savingsGoal,
                color: "purple",
                icon: "M9 12l2 2 4-4...",
                progress: (summaryData.balance / summaryData.savingsGoal) * 100,
              },
              { label: "Alerts", value: summaryData.alerts, color: "yellow", icon: "M12 9v2..." },
            ].map((card, idx) => (
              <div key={idx} className={`bg-[#1c042a] rounded-xl p-6 border-l-4 border-${card.color}-500 shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">{card.label}</p>
                    <p className="text-2xl font-bold">${card.value.toLocaleString()}</p>
                    {card.progress && (
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className={`bg-${card.color}-500 h-2 rounded-full`}
                          style={{ width: `${card.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className={`bg-${card.color}-100 p-3 rounded-full`}>
                    <svg className={`w-6 h-6 text-${card.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d={card.icon} />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Analytics + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Analytics Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Monthly Trends */}
              <div className="bg-[#1c042a] rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-purple-300 mb-4">Monthly Trends</h3>
                <div className="flex items-end justify-between h-48">
                  {chartData.monthlyTrends.map((month, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="flex items-end space-x-2">
                        <div
                          className="w-6 bg-blue-500 rounded-t"
                          style={{ height: `${(month.income / 4000) * 100}%` }}
                        ></div>
                        <div
                          className="w-6 bg-red-500 rounded-t"
                          style={{ height: `${(month.expenses / 2000) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-400 mt-2">{month.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category-wise Expenses */}
              <div className="bg-[#1c042a] rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-purple-300 mb-4">Category-wise Expenses</h3>
                <div className="space-y-4">
                  {chartData.categoryExpenses.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>{cat.category}</span>
                      <div className="w-1/2 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${(cat.amount / 500) * 100}%` }}
                        ></div>
                      </div>
                      <span>${cat.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expense vs Income + Quick Actions */}
            <div className="space-y-6">
              {/* Expense vs Income */}
              <div className="bg-[#1c042a] rounded-xl p-6 shadow-lg flex flex-col items-center">
                <h3 className="text-lg font-semibold text-purple-300 mb-4">Expense vs Income</h3>
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b0252" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray={`${chartData.expenseVsIncome.income * 2.51} ${
                        chartData.expenseVsIncome.expenses * 2.51
                      }`}
                      strokeDashoffset="25"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col text-center">
                    <span className="text-2xl font-bold">{chartData.expenseVsIncome.income}%</span>
                    <span className="text-sm text-gray-400">Income</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#1c042a] rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-purple-300 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg">Add Income</button>
                  <button className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg">Add Expense</button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg">Create Budget</button>
                  <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg">Generate Report</button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#1c042a] rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-purple-300">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-gray-200">
                <thead>
                  <tr className="text-left border-b border-purple-700/50 text-sm">
                    <th className="pb-3 font-medium">Transaction</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-purple-700/20 last:border-0">
                      <td className="py-4">{t.name}</td>
                      <td className="py-4">{t.category}</td>
                      <td className="py-4">{t.date}</td>
                      <td className={`py-4 text-right ${t.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                        {t.amount > 0 ? "+" : "-"}${Math.abs(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceDashboard;
