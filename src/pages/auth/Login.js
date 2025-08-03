import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Link as RouterLink } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Login = () => {
  const navigate = useNavigate();
  const { login, error: authError, loading, user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    // Only redirect if user is actually authenticated in context
    // This prevents redirect loops with invalid localStorage data
    if (user) {
      console.log("User already authenticated, redirecting to dashboard");

      // Determine redirect path based on role
      let redirectPath = "/login";
      if (user.role === "superAdmin") redirectPath = "/super-admin/dashboard";
      else if (user.role === "admin") redirectPath = "/admin/leads";
      else if (user.role === "marketingAgent")
        redirectPath = "/admin/chat-config";
      else if (user.role === "admissionAgent")
        redirectPath = "/admin/chat-config";

      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setLocalError(result.error || "Login failed");
      }
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>
          Login - Nyota Fusion AI | Access Your Lead Management Dashboard
        </title>
        <meta
          name="description"
          content="Login to your Nyota Fusion AI account to access powerful lead management tools, student enrollment tracking, and AI-powered admissions automation."
        />
        <meta
          name="keywords"
          content="login, Nyota Fusion AI, lead management dashboard, school admissions login, educational technology platform"
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Login - Nyota Fusion AI" />
        <meta
          property="og:description"
          content="Access your AI-powered lead management dashboard for educational institutions."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://nyotafusionai.com/hero.jpg"
        />
        <meta property="og:image:width" content="1440" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:site_name" content="Nyota Fusion AI" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Login - Nyota Fusion AI" />
        <meta
          name="twitter:description"
          content="Access your AI-powered lead management dashboard for educational institutions."
        />
        <meta
          name="twitter:image"
          content="https://nyotafusionai.com/hero.jpg"
        />
      </Helmet>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-blue-50 opacity-30"></div>

      {/* Login Container */}
      <div className="relative max-w-md w-full space-y-8">
        {/* Header with Logo */}
        <div className="text-center">
          <RouterLink to="/" className="inline-block mb-6 no-underline">
            <h1 className="text-3xl font-bold text-gray-900 hover:text-red-800 transition-colors">
              Nyota Fusion AI
            </h1>
          </RouterLink>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 placeholder-gray-500"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {/* Error Message */}
            {(authError || localError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">
                  {authError || localError}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-800 hover:bg-red-900 focus:ring-4 focus:ring-red-200 transform hover:scale-105"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Nyota Fusion AI. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Powered by Nyota Innovations
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
