import { addTransaction, getTransactions, deleteTransaction } from "../models/transactionModel.js";

// ✅ Add Transaction Controller
export const addTransactionController = async (req, res) => {
  try {
    const { merchant, amount, category_id,  transaction_date, description, currency,type } = req.body;
    const userId = req.user?.id;

    if (!merchant || !amount || !category_id || !transaction_date) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const newTransaction = await addTransaction(
      userId,
      merchant,
      amount,
      category_id,
      type,
      transaction_date,
      description,
      currency || "INR"
    );

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Add Transaction Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// ✅ Get Transactions Controller
export const getTransactionsController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const transactions = await getTransactions(userId);
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Delete Transaction Controller
export const deleteTransactionController = async (req, res) => {
  try {
    const deleted = await deleteTransaction(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Transaction not found" });

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
