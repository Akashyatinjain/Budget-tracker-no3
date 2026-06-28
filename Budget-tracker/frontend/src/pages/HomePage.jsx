import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaWallet, FaChartPie, FaBell, FaUsers, FaClock, 
  FaMoneyBillWave, FaArrowRight, FaShieldAlt, FaChartLine 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Particles from "../components/Particles.jsx";

const features = [
  {
    icon: <FaWallet className="text-4xl" />,
    title: "Intelligent Expense Tracking",
    description: "Automatic categorization, receipt scanning, and real-time spend analysis.",
    color: "emerald"
  },
  {
    icon: <FaBell className="text-4xl" />,
    title: "Smart Bill Reminders",
    description: "Predictive alerts and automated payment tracking to avoid late fees.",
    color: "emerald"
  },
  {
    icon: <FaChartPie className="text-4xl" />,
    title: "Powerful Analytics",
    description: "Deep financial insights, forecasting, and AI-driven recommendations.",
    color: "emerald"
  },
  {
    icon: <FaShieldAlt className="text-4xl" />,
    title: "Enterprise Grade Security",
    description: "Bank-level encryption, two-factor authentication & data privacy.",
    color: "emerald"
  }
];

const stats = [
  { value: "25,000+", label: "Active Users" },
  { value: "₹285 Cr+", label: "Transactions Processed" },
  { value: "4.9/5", label: "User Rating" },
];

const testimonials = [
  {
    quote: "FinTrack has brought discipline into my financial life. The insights are truly actionable.",
    name: "Priya Sharma",
    role: "Chartered Accountant",
    avatar: "👩🏻‍💼"
  },
  {
    quote: "Best financial tool for professionals in India. Clean interface and powerful features.",
    name: "Rahul Mehra",
    role: "Tech Entrepreneur",
    avatar: "👨🏻‍💻"
  },
  {
    quote: "Finally an app that understands Indian finance — UPI, taxes, investments, everything.",
    name: "Ananya Rao",
    role: "Investment Analyst",
    avatar: "👩🏽‍💼"
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="bg-[#0A0F1C] text-white min-h-screen overflow-x-hidden">
      {/* Subtle Background */}
      <div className="fixed inset-0 z-0">
        <Particles
          particleColors={["#10b981", "#64748b", "#0ea5e9"]}
          particleCount={80}
          speed={0.08}
          particleBaseSize={60}
          alphaParticles={true}
        />
      </div>

      {/* Professional Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F1C]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white">
              ₹
            </div>
            <span className="text-3xl font-semibold tracking-tight">FinTrack</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#insights" className="hover:text-white transition-colors">Insights</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/sign-in")}
              className="px-7 py-3 text-sm font-medium rounded-2xl hover:bg-white/5 transition-colors"
            >
              Log in
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/sign-up")}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold rounded-2xl transition-all duration-200"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 relative z-10">
        <div className="max-w-screen-2xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-emerald-500/20 text-emerald-400 text-sm px-5 py-2 rounded-3xl">
              Trusted by finance professionals across India
            </div>

            <h1 className="text-6xl lg:text-7xl font-semibold leading-tight tracking-tighter text-white">
              Master your finances<br />with clarity and confidence
            </h1>

            <p className="text-xl text-gray-400 max-w-lg">
              A sophisticated finance management platform designed for professionals who value precision, security, and actionable intelligence.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/sign-up")}
                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-2xl flex items-center gap-3 text-lg transition-all"
              >
                Start Your Free Trial
                <FaArrowRight />
              </motion.button>

              <button 
                onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-4 border border-white/30 hover:border-white/50 rounded-2xl font-medium transition-all"
              >
                See the Dashboard
              </button>
            </div>
          </div>

          {/* Professional Dashboard Preview */}
          <motion.div
            id="demo"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-[#111827] border border-gray-700 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-[#0F172A] px-6 py-4 flex items-center justify-between border-b border-gray-700">
                <div className="font-medium">Dashboard • Overview</div>
                <div className="text-emerald-400 text-sm">March 2026</div>
              </div>
              
              <div className="p-8 space-y-8">
                <div>
                  <p className="text-gray-400 text-sm">Net Worth</p>
                  <p className="text-5xl font-semibold tracking-tighter mt-2">₹68,42,750</p>
                  <p className="text-emerald-400 text-sm mt-1 flex items-center gap-1">
                    ▲ ₹4,28,390 (6.7%) this month
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    ["Income", "₹2,84,000", "emerald"],
                    ["Expenses", "₹1,67,450", "orange"],
                    ["Savings", "₹1,16,550", "sky"]
                  ].map(([label, amount, color]) => (
                    <div key={label} className="bg-[#1F2937] rounded-2xl p-4">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className={`text-2xl font-semibold mt-2 ${color === 'emerald' ? 'text-emerald-400' : color === 'orange' ? 'text-orange-400' : 'text-sky-400'}`}>
                        {amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Professional Badge */}
            <div className="absolute -top-4 -right-4 bg-[#111827] border border-emerald-500/30 text-emerald-400 text-xs px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
              <FaChartLine /> AI Insights Active
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-black/40 border-t border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold">Built for Financial Excellence</h2>
            <p className="text-gray-400 mt-3 text-lg">Precision tools for serious money management</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111827] border border-gray-700 hover:border-emerald-600/50 rounded-3xl p-8 transition-all group"
              >
                <div className="text-emerald-500 mb-6 transition-transform group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="border border-gray-700 rounded-3xl py-12">
                <div className="text-6xl font-semibold text-white tracking-tighter">{stat.value}</div>
                <div className="text-gray-400 mt-3 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="insights" className="py-24 bg-[#0A0F1C]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-semibold mb-16">Trusted by Professionals</h2>

          <div className="relative min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 bg-[#111827] border border-gray-700 rounded-3xl p-12"
              >
                <p className="text-2xl leading-relaxed text-gray-200 italic">
                  “{testimonials[currentTestimonial].quote}”
                </p>
                <div className="mt-10 flex items-center gap-4 justify-center">
                  <span className="text-4xl">{testimonials[currentTestimonial].avatar}</span>
                  <div>
                    <div className="font-semibold">{testimonials[currentTestimonial].name}</div>
                    <div className="text-emerald-500 text-sm">{testimonials[currentTestimonial].role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 border-t border-white/5">
        <div className="max-w-xl mx-auto text-center px-6">
          <h2 className="text-5xl font-semibold tracking-tight">Start building wealth today</h2>
          <p className="text-gray-400 mt-6 text-lg">14-day free trial. No credit card required.</p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate("/sign-up")}
            className="mt-10 px-16 py-5 bg-emerald-600 hover:bg-emerald-500 text-lg font-semibold rounded-2xl inline-flex items-center gap-3 transition-all"
          >
            Create Professional Account
            <FaArrowRight />
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 border-t border-white/5 text-gray-400">
        <div className="max-w-screen-2xl mx-auto px-8 text-center">
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center text-2xl">₹</div>
            <span className="text-2xl font-semibold text-white">FinTrack</span>
          </div>
          <p>© 2026 FinTrack. Professional Finance Management.</p>
        </div>
      </footer>
    </div>
  );
}