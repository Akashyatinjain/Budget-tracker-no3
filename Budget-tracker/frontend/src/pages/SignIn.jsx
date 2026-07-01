import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { Mail, Lock, Eye, EyeOff, ArrowRight, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const API_BASE = (import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function SignIn() {
  const [form, setForm] = useState({ emailOrName: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    document.title = "Sign In | FinTrack Budget Tracker";
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      toast.success("Successfully logged in with Google!");
      window.location.href = "/dashboard";
    }
  }, []);

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.emailOrName || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(form.emailOrName, form.password);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Sign in error:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Invalid credentials. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f] text-white selection:bg-emerald-500/30 selection:text-white">
      
      {/* Geometric Background Pattern - Inspired by FinTrack */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.05)_0%,_transparent_60%)]" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
        
        {/* Decorative floating blobs */}
        <div className="absolute top-10 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Brand & Value Prop - FinTrack Style */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="hidden lg:flex flex-col justify-center space-y-8 p-4"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white">
                FinTrack
              </span>
              <span className="block text-xs text-emerald-400 font-medium tracking-wider uppercase">
                Trusted by finance professionals
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
              Master your finances with
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mt-1">
                clarity and confidence
              </span>
            </h1>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-base leading-relaxed max-w-md">
            A sophisticated finance management platform designed for professionals who value precision, security, and actionable intelligence.
          </p>

          {/* Stats/Features - Mimicking Dashboard Overview */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { label: "Net Worth", value: "₹68.4L", change: "+6.7%" },
              { label: "Monthly Savings", value: "₹1.16L", change: "+12.3%" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5"
              >
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {stat.value}
                </div>
                <div className="text-xs text-emerald-400 font-medium">
                  ↑ {stat.change}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Bank-grade security</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Smart insights</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Real-time analytics</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Sign In Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-[#111118]/90 backdrop-blur-2xl rounded-2xl p-8 border border-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                  Secure Portal Active
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-gray-400 text-sm mt-1.5">
                Sign in to your FinTrack dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username or Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Username or Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    name="emailOrName"
                    value={form.emailOrName}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition duration-200 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition duration-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-gray-500 hover:text-white transition focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button - Gradient matching FinTrack */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full group relative flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Or continue with
              </span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-all duration-200 active:scale-[0.97]"
            >
              <FcGoogle className="w-5 h-5" />
              <span>Sign in with Google</span>
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-400 mt-8">
              Don't have an account?{" "}
              <Link to="/sign-up" className="font-semibold text-emerald-400 hover:text-emerald-300 transition hover:underline">
                Get Started
              </Link>
            </p>

            {/* Trust badge - Mobile only */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/5 lg:hidden">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-gray-500">Secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-gray-500">Analytics</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}