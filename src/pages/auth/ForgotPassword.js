import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { authService } from "../../services/authService";
import { Helmet } from "react-helmet";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      const result = await authService.forgotPassword(email);

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message || "Failed to send reset email");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError(
        err.message || "An error occurred while processing your request"
      );
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Reset Password - Nyota Fusion AI | Recover Your Account</title>
        <meta
          name="description"
          content="Reset your Nyota Fusion AI account password securely. Enter your email to receive password recovery instructions for your lead management dashboard."
        />
        <meta
          name="keywords"
          content="reset password, forgot password, Nyota Fusion AI, account recovery, password recovery, secure login"
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Reset Password - Nyota Fusion AI" />
        <meta
          property="og:description"
          content="Secure password recovery for your AI-powered lead management account."
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
        <meta name="twitter:title" content="Reset Password - Nyota Fusion AI" />
        <meta
          name="twitter:description"
          content="Secure password recovery for your AI-powered lead management account."
        />
        <meta
          name="twitter:image"
          content="https://nyotafusionai.com/hero.jpg"
        />
      </Helmet>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-blue-50 opacity-30"></div>

      {/* Reset Password Container */}
      <div className="relative max-w-md w-full space-y-8">
        {/* Header with Logo */}
        <div className="text-center">
          <RouterLink to="/" className="inline-block mb-6 no-underline">
            <h1 className="text-3xl font-bold text-gray-900 hover:text-red-800 transition-colors">
              Nyota Fusion AI
            </h1>
          </RouterLink>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Reset your password
            </h2>
            <p className="text-gray-600">
              {!submitted
                ? "Enter your email address and we'll send you instructions to reset your password."
                : "Check your email for password reset instructions."}
            </p>
          </div>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {!submitted ? (
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
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

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
                    Sending...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <i className="fas fa-check-circle text-green-500 text-2xl"></i>
                </div>
                <p className="text-green-700 font-medium">
                  Email sent successfully!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Please check your inbox and follow the instructions to reset
                  your password.
                </p>
              </div>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                  setError("");
                }}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
              >
                Send another email
              </button>
            </div>
          )}

          {/* Back to Login */}
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Login
            </button>
          </div>
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

export default ForgotPassword;
