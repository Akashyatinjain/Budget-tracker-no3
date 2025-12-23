// src/pages/SignIn.jsx
import React, { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import Particles from "../components/Particles.jsx";
import { useNavigate } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

export default function SignIn() {
  const [form, setForm] = useState({ emailOrName: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailOrName: form.emailOrName, password: form.password }),
        credentials: "include", // allow cookies (JWT token) to be set by server
      });

      const data = await res.json().catch(() => ({}));
      console.log("Response:", res.status, data);

      if (res.ok) {
        // server returns token and user — save token if present (optional)
        if (data.token) localStorage.setItem("token", data.token);
        navigate("/DashBoard");
      } else {
        alert(data.error || data.message || "Sign in failed");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Something went wrong. Try again!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Login Redirect (use deployed backend URL)
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  // Capture token from URL after Google redirect (if backend appends token in query)
  useEffect(() => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    localStorage.setItem("token", token);
    navigate("/DashBoard", { replace: true });
  }
}, [navigate]);


  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={["#ffffff", "#a855f7", "#6366f1"]}
          particleCount={200}
          particleSpread={10}
          speed={0.15}
          particleBaseSize={120}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* Sign In Card */}
      <div className="relative z-10 w-full max-w-md bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.8)] border border-gray-800 p-8">
        <h2 className="text-3xl font-extrabold text-center text-white tracking-wide">
          Welcome Back
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Sign in with your username or email
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username or Email */}
          <div className="text-left">
            <label className="block text-gray-300 text-sm mb-2">Username or Email</label>
            <input
              type="text"
              name="emailOrName"
              value={form.emailOrName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              placeholder="john_doe or you@example.com"
            />
          </div>

          {/* Password */}
          <div className="text-left">
            <label className="block text-gray-300 text-sm mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {/* Options */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="accent-purple-600" />
              <span>Remember me</span>
            </label>
            <a href="#" className="hover:text-purple-400 transition">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r from-purple-600 to-purple-700 
              hover:from-purple-700 hover:to-purple-800 text-white font-semibold 
              py-3 rounded-xl transition transform hover:scale-[1.02] shadow-lg
              ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-700" />
          <span className="px-3 text-gray-500 text-sm">OR</span>
          <hr className="flex-grow border-gray-700" />
        </div>

        {/* Google Sign in */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 rounded-xl shadow-md hover:bg-gray-100 transition"
        >
          <FcGoogle size={22} /> Continue with Google
        </button>

        {/* Sign Up */}
        <p className="text-sm text-gray-400 text-center mt-6">
          Don’t have an account?{" "}
          <a href="/Finance-Tracker/sign-up" className="text-purple-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
