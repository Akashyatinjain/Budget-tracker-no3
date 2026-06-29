// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import transactionReducer from "./transactionSlice";
import subscriptionReducer from "./subscriptionSlice";
import budgetReducer from "./budgetSlice";
import currencyReducer from "./currencySlice";
import notificationReducer from "./notificationSlice";
import reportReducer from "./reportSlice";
import userReducer from "./userSlice";

const store = configureStore({
  reducer: {
    transactions: transactionReducer,
    subscriptions: subscriptionReducer,
    budgets: budgetReducer,
    currencies: currencyReducer,
    notifications: notificationReducer,
    reports: reportReducer,
    user: userReducer,
  },
});

export default store;
