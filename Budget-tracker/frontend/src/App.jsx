import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashBoard from './pages/dashBoard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AccountHolderPage from "./pages/AccountHolder";
import TransactionPage from "./pages/TransactionPage";
import AnalyticsPage from './pages/AnalyticsPage';
import BudgetPage from './pages/BudgetPage';
import TrendsPage from './pages/TrendPage';
import CurrenciesPage from './pages/CurrenciesPage';
import SubscriptionsPage from './pages/Subscription';
import ReportsPage from './pages/Report';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingPage';
import FriendLoansPage from './pages/FriendLoansPage';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

export const applyTheme = (theme) => {
  const root = document.documentElement;
  let activeTheme = theme;
  if (theme === "auto") {
    activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(`theme-${activeTheme}`);
  localStorage.setItem("fintrack_theme", theme);
};

function App() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("fintrack_theme") || "dark";
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const currentTheme = localStorage.getItem("fintrack_theme");
      if (currentTheme === "auto") {
        applyTheme("auto");
      }
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Core Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashBoard /></ProtectedRoute>} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <AccountHolderPage />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
        <Route path="/trends" element={<ProtectedRoute><TrendsPage /></ProtectedRoute>} />
        <Route path="/currencies" element={<ProtectedRoute><CurrenciesPage /></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/friend-loans" element={<ProtectedRoute><FriendLoansPage /></ProtectedRoute>} />

        {/* Legacy / Alias / App Prefix Routes */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        <Route path="/app/dashboard" element={<ProtectedRoute><DashBoard /></ProtectedRoute>} />
        <Route path="/app/account" element={<ProtectedRoute><AccountHolderPage /></ProtectedRoute>} />
        <Route path="/app/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
        <Route path="/app/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/app/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/app/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
        <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/app/friend-loans" element={<ProtectedRoute><FriendLoansPage /></ProtectedRoute>} />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
