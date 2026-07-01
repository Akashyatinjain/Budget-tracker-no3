// src/middleware/errorHandler.js

// ✅ Centralized Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error:", err.stack || err.message || err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: err.message || "Internal Server Error",
    // Optional: show stack only in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

// ✅ Utility to throw custom errors easily
export const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
