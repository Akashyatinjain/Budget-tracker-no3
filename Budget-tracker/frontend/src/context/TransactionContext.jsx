// src/context/TransactionContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);

  const token = localStorage.getItem("token");
  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch logged-in user
  useEffect(() => {
    if (!token) return;
    axios.get(`${VITE_BASE_URL}/api/users/me`, axiosConfig)
      .then(res => setUser(res.data.user))
      .catch(err => console.error("Fetch user error:", err));
  }, []);

  // Fetch transactions once user is loaded
  useEffect(() => {
    if (!user) return;
    axios.get(`${VITE_BASE_URL}/api/transactions`, axiosConfig)
      .then(res => setTransactions(res.data.transactions || res.data))
      .catch(err => console.error("Fetch transactions error:", err));
  }, [user]);

  // Add new transaction
  const addTransaction = async (transaction) => {
    try {
      await axios.post(`${VITE_BASE_URL}/api/transactions`, transaction, axiosConfig);
      const res = await axios.get(`${VITE_BASE_URL}/api/transactions`, axiosConfig);
      setTransactions(res.data.transactions || res.data);
    } catch (err) {
      console.error("Add transaction error:", err);
    }
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, user }}>
      {children}
    </TransactionContext.Provider>
  );
};
