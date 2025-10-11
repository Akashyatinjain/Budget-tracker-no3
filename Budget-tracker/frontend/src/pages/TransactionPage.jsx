// TransactionPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import AdvancedSidebar from "../components/Sidebar";

const TransactionPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    merchant: "",
    category_id: "",
    type: "expense",
    amount: "",
    currency: "INR",
    transaction_date: "",
    description: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/api/transactions");
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/transactions", newTransaction);
      fetchTransactions();
      setShowModal(false);
      setNewTransaction({
        merchant: "",
        category_id: "",
        type: "expense",
        amount: "",
        currency: "INR",
        transaction_date: "",
        description: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    { id: 1, name: "Food & Dining" },
    { id: 2, name: "Shopping" },
    { id: 3, name: "Transportation" },
    { id: 4, name: "Entertainment" },
    { id: 5, name: "Bills & Utilities" },
    { id: 6, name: "Healthcare" },
    { id: 7, name: "Salary" },
    { id: 8, name: "Investment" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-[#0a0014] to-[#1a002a] text-gray-100">
      <AdvancedSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />

        <main className="p-6 mt-16">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-purple-400">
                Transactions
              </h1>
              <p className="text-gray-400">
                Manage your income and expenses efficiently
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-800 transition-all duration-200 shadow-md"
            >
              + Add Transaction
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <p className="text-sm text-gray-400">Total Balance</p>
              <h2 className="text-2xl font-semibold text-purple-300 mt-1">
                ₹
                {transactions
                  .reduce((sum, t) => {
                    const amount = parseFloat(t.amount || 0);
                    return t.type === "income" ? sum + amount : sum - amount;
                  }, 0)
                  .toLocaleString("en-IN")}
              </h2>
            </div>
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <p className="text-sm text-gray-400">Total Income</p>
              <h2 className="text-2xl font-semibold text-green-400 mt-1">
                ₹
                {transactions
                  .filter((t) => t.type === "income")
                  .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                  .toLocaleString("en-IN")}
              </h2>
            </div>
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <p className="text-sm text-gray-400">Total Expenses</p>
              <h2 className="text-2xl font-semibold text-red-400 mt-1">
                ₹
                {transactions
                  .filter((t) => t.type === "expense")
                  .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                  .toLocaleString("en-IN")}
              </h2>
            </div>
            <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl p-5 shadow-md">
              <p className="text-sm text-gray-400">Total Transactions</p>
              <h2 className="text-2xl font-semibold text-indigo-400 mt-1">
                {transactions.length}
              </h2>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 p-4 rounded-xl mb-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-3 flex-wrap">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent border border-purple-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select className="bg-transparent border border-purple-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500">
                <option>All Categories</option>
                {categories.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border border-purple-700 rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1b0128]/70 border border-purple-800/30 rounded-xl overflow-x-auto shadow-md">
            <table className="min-w-full text-sm">
              <thead className="bg-purple-950/50 text-purple-300 uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 text-left">Merchant</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .filter(
                    (t) => filter === "all" || t.type.toLowerCase() === filter
                  )
                  .map((t) => (
                    <tr
                      key={t.transaction_id}
                      className="border-t border-purple-800/30 hover:bg-purple-900/20 transition"
                    >
                      <td className="py-3 px-4">{t.merchant}</td>
                      <td className="py-3 px-4 text-purple-300">
                        {t.category_name || t.category_id}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(t.transaction_date).toLocaleDateString()}
                      </td>
                      <td
                        className={`py-3 px-4 ${
                          t.type === "income"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {t.type}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {t.type === "income" ? "+" : "-"}₹
                        {parseFloat(t.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {transactions.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                No transactions found.
              </div>
            )}
          </div>
        </main>

        {/* Add Transaction Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1b0128] border border-purple-700/50 rounded-xl w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-purple-300 mb-4">
                Add New Transaction
              </h2>
              <form
                onSubmit={handleAddTransaction}
                className="flex flex-col gap-4"
              >
                <input
                  type="text"
                  placeholder="Merchant"
                  value={newTransaction.merchant}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      merchant: e.target.value,
                    })
                  }
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      amount: e.target.value,
                    })
                  }
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={newTransaction.type}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      type: e.target.value,
                    })
                  }
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  type="date"
                  value={newTransaction.transaction_date}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      transaction_date: e.target.value,
                    })
                  }
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={newTransaction.category_id}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      category_id: e.target.value,
                    })
                  }
                  required
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                  className="bg-transparent border border-purple-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                ></textarea>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white transition-all"
                  >
                    Add Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionPage;
