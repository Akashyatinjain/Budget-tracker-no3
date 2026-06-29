import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient, { isTokenExpired } from "../services/apiClient";

const AuthContext = createContext();

// Export api for backwards compatibility
export const api = apiClient;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken && !isTokenExpired(urlToken)) {
        localStorage.setItem("token", urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        return urlToken;
      }
    } catch (e) {}
    const saved = localStorage.getItem("token");
    if (saved && isTokenExpired(saved)) {
      localStorage.removeItem("token");
      return null;
    }
    return saved;
  });
  const [loading, setLoading] = useState(true);

  const saveToken = (newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  };

  const fetchUser = async (overrideToken) => {
    const activeToken = overrideToken || token || localStorage.getItem("token");
    if (!activeToken || isTokenExpired(activeToken)) {
      saveToken(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get("/api/users/me");
      if (res.data) {
        setUser(res.data.user || res.data);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        saveToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const login = async (emailOrName, password) => {
    const res = await apiClient.post("/sign-in", { emailOrName, password });
    if (res.data && res.data.token) {
      saveToken(res.data.token);
      if (res.data.user) setUser(res.data.user);
      else await fetchUser(res.data.token);
    }
    return res.data;
  };

  const signup = async (username, email, password) => {
    const res = await apiClient.post("/sign-up", { username, email, password });
    if (res.data && res.data.token) {
      saveToken(res.data.token);
      if (res.data.user) setUser(res.data.user);
      else await fetchUser(res.data.token);
    }
    return res.data;
  };

  const logout = () => {
    saveToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        login,
        signup,
        logout,
        fetchUser,
        isAuthenticated: !!token && !isTokenExpired(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
