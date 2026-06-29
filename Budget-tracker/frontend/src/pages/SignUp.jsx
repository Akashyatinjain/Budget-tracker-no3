import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, TrendingUp, CheckCircle2, AlertCircle, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const API_BASE = (import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function SignUp() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500", text: "text-red-400" };
    if (score <= 4) return { score, label: "Medium", color: "bg-yellow-500", text: "text-yellow-400" };
    return { score, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
  };

  const strength = calculatePasswordStrength(form.password);

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = "Username is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email format";

    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Must be at least 6 characters long";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signup(form.username, form.email, form.password);
      toast.success("Account created successfully!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Sign up error:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Registration failed. Please try again.";
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
      
      {/* Geometric Background Pattern - FinTrack Style */}
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
        
        {/* Left Side: Brand & Benefits - FinTrack Style */}
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
              Start mastering your
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mt-1">
                financial journey today
              </span>
            </h1>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-base leading-relaxed max-w-md">
            Join thousands of finance professionals who trust FinTrack for precision tracking, smart insights, and actionable intelligence.
          </p>

          {/* Stats/Features - Dashboard Overview Style */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { label: "Active Users", value: "10K+", change: "+24%" },
              { label: "Transactions Tracked", value: "₹2.4Cr", change: "+18.5%" },
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

          {/* Trust Badges */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
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

        {/* Right Side: Sign Up Card */}
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
                  Join 10,000+ Users
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Create your account
              </h2>
              <p className="text-gray-400 text-sm mt-1.5">
                Start your financial journey with FinTrack
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="john_doe"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border ${
                      errors.username ? "border-red-500/80 focus:ring-red-500/40" : "border-white/10 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                    } text-white placeholder-gray-500/70 focus:outline-none focus:ring-2 transition duration-200 text-sm`}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border ${
                      errors.email ? "border-red-500/80 focus:ring-red-500/40" : "border-white/10 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                    } text-white placeholder-gray-500/70 focus:outline-none focus:ring-2 transition duration-200 text-sm`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white/5 border ${
                      errors.password ? "border-red-500/80 focus:ring-red-500/40" : "border-white/10 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                    } text-white placeholder-gray-500/70 focus:outline-none focus:ring-2 transition duration-200 text-sm`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-gray-500 hover:text-white transition focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
                  </p>
                )}

                {/* Password Strength Indicator */}
                {form.password && (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Strength:
                      </span>
                      <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex gap-1 p-0.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            level <= strength.score ? strength.color : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button - FinTrack Gradient */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full group relative flex items-center justify-center gap-2 py-3.5 px-4 mt-2 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Or sign up with
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
              <span>Continue with Google</span>
            </button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-400 mt-8">
              Already have an account?{" "}
              <Link to="/sign-in" className="font-semibold text-emerald-400 hover:text-emerald-300 transition hover:underline">
                Sign in
              </Link>
            </p>

            {/* Trust badge - Mobile only */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/5 lg:hidden">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
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