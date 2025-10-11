import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import Particles from "../components/Particles.jsx";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle input change
 const handleChange = (e) => {
  const { name, value } = e.target; // ✅ Correct
  setForm((prev) => ({ ...prev, [name]: value }));

  // Clear error for this field
  setErrors((prev) => ({ ...prev, [name]: "" }));
};

  // Validate fields
  const validateForm = (values) => {
    const newErrors = {};
    if (!values.username.trim()) newErrors.username = "Username is required.";
    if (!values.email.trim()) newErrors.email = "Email is required.";
    if (!values.password.trim()) newErrors.password = "Password is required.";
    else if (values.password.length < 6)
      newErrors.password = "Password must be at least 6 characters long.";
    return newErrors;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      // Send `username` as `name` to backend
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
      };

      const res = await fetch("http://localhost:5000/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) return alert(data.error || "Sign up failed");

      alert("✅ Sign Up Successful!");
      localStorage.setItem("token", data.token);
      navigate("/DashBoard");
    } catch (err) {
      console.error("Signup error:", err);
      alert("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = () => {
  window.location.href = "http://localhost:5000/auth/google";
};

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={["#ffffff", "#a855f7", "#6366f1"]}
          particleCount={200}
          particleSpread={10}
          speed={0.15}
          particleBaseSize={120}
          moveParticlesOnHover
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      <div className="relative z-10 w-full max-w-md bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 shadow-[0_0_25px_rgba(0,0,0,0.8)] p-8">
        <h2 className="text-3xl font-extrabold text-center text-white tracking-wide">
          Create Account
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Sign up to get started with your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="john_doe"
              className={`w-full px-4 py-3 rounded-xl bg-gray-800/80 border ${
                errors.username ? "border-red-500" : "border-gray-700"
              } text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition`}
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full px-4 py-3 rounded-xl bg-gray-800/80 border ${
                errors.email ? "border-red-500" : "border-gray-700"
              } text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition`}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl bg-gray-800/80 border ${
                errors.password ? "border-red-500" : "border-gray-700"
              } text-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none transition`}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="accent-purple-600" />
              <span>Remember me</span>
            </label>
            <a href="#" className="hover:text-purple-400 transition">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white 
              bg-gradient-to-r from-purple-600 to-purple-700 
              hover:from-purple-700 hover:to-purple-800 
              transform hover:scale-[1.02] shadow-lg transition 
              ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-700" />
          <span className="px-3 text-gray-500 text-sm">OR</span>
          <hr className="flex-grow border-gray-700" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl 
            bg-white text-gray-900 font-medium shadow-md hover:bg-gray-100 transition"
        >
          <FcGoogle size={22} /> Continue with Google
        </button>
      </div>
    </div>
  );
}
