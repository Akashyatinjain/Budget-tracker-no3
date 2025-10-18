// useTransactions.js
import { useEffect, useState } from "react";
import axios from "axios";

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    axios.get("/transactions", { withCredentials: true })
      .then(res => setTransactions(res.data.transactions))
      .catch(err => console.error(err));
  }, []);

  return transactions;
};
