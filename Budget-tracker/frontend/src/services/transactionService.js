import apiClient from "./apiClient";

export const transactionService = {
  getTransactions: async () => {
    const res = await apiClient.get("/api/transactions");
    return res.data.transactions || res.data || [];
  },
  addTransaction: async (data) => {
    const res = await apiClient.post("/api/transactions", data);
    return res.data;
  },
  updateTransaction: async (id, data) => {
    const res = await apiClient.put(`/api/transactions/${id}`, data);
    return res.data;
  },
  deleteTransaction: async (id) => {
    const res = await apiClient.delete(`/api/transactions/${id}`);
    return res.data;
  },
  importTransactions: async (rows) => {
    const res = await apiClient.post("/api/transactions/import", { rows });
    return res.data;
  },
};

export default transactionService;
