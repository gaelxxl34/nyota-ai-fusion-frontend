import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Helmet } from "react-helmet";

const LandingPage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  const testimonials = [
    {
      quote:
        "Nyota Fusion AI cut our lead processing time in half and increased our enrollment conversion rate by 35%.",
      school: "Riverside Academy",
      icon: "fas fa-graduation-cap",
    },
    {
      quote:
        "The AI scoring system helps us prioritize the most qualified prospects automatically.",
      school: "Metro Charter School",
      icon: "fas fa-school",
    },
    {
      quote:
        "Real-time analytics give us insights we never had before into our admissions funnel.",
      school: "Pinnacle Education",
      icon: "fas fa-university",
    },
  ];

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 6000); // 6 seconds for better experience

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Splash Screen Component
  const SplashScreen = () => (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-red-900 via-red-800 to-red-700 flex items-center justify-center overflow-hidden">
      {/* Animated background particles - fewer on mobile */}
      <div className="absolute inset-0">
        {[...Array(window.innerWidth < 768 ? 25 : 50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Central content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
        {/* Logo animation */}
        <div className="mb-6 sm:mb-8 transform animate-bounce">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 relative">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-3 sm:border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            {/* Inner pulsing circle */}
            <div className="absolute inset-3 sm:inset-4 bg-white rounded-full animate-pulse flex items-center justify-center">
              <i className="fas fa-brain text-red-800 text-2xl sm:text-4xl"></i>
            </div>
          </div>
        </div>

        {/* Company name with typewriter effect */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-3 sm:mb-4 animate-pulse leading-tight">
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "0.1s" }}
          >
            N
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "0.2s" }}
          >
            y
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "0.3s" }}
          >
            o
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "0.4s" }}
          >
            t
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "0.5s" }}
          >
            a
          </span>
          <span className="mx-1 sm:mx-2"></span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "0.6s" }}
          >
            F
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "0.7s" }}
          >
            u
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "0.8s" }}
          >
            s
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "0.9s" }}
          >
            i
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "1.0s" }}
          >
            o
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "1.1s" }}
          >
            n
          </span>
          <span className="mx-1 sm:mx-2"></span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "1.2s" }}
          >
            A
          </span>
          <span
            className="inline-block animate-bounce"
            style={{ animationDelay: "1.3s" }}
          >
            I
          </span>
        </h1>

        {/* Tagline with fade-in effect */}
        <p
          className="text-lg sm:text-xl md:text-2xl text-red-100 mb-6 sm:mb-8 animate-pulse px-2"
          style={{ animationDelay: "2s" }}
        >
          Revolutionizing Admissions with AI
        </p>

        {/* Loading bar */}
        <div className="w-48 sm:w-64 mx-auto mb-4 sm:mb-6">
          <div className="bg-red-600 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div
              className="bg-white h-full rounded-full animate-pulse"
              style={{
                animation: "loadingBar 5s ease-out forwards",
              }}
            ></div>
          </div>
        </div>

        {/* Powered by text */}
        <p className="text-red-200 text-xs sm:text-sm animate-pulse">
          Powered by Nyota Innovations
        </p>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes loadingBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
      `}</style>
    </div>
  );

  // Show splash screen for 5 seconds
  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>
          Nyota Fusion AI - Revolutionize School Admissions with AI Lead
          Management
        </title>
        <meta
          name="description"
          content="Transform your educational institution's admissions process with Nyota Fusion AI. Auto-capture, qualify, and convert student leads with intelligent automation. Increase enrollment conversion rates by 35%."
        />
        <meta
          name="keywords"
          content="AI lead management, school admissions, educational technology, student enrollment, lead automation, admission software, EdTech, student recruitment, enrollment management, AI for education"
        />
        <meta name="author" content="Nyota Innovations" />

        {/* Open Graph Meta Tags */}
        <meta
          property="og:title"
          content="Nyota Fusion AI - AI-Powered School Admissions Platform"
        />
        <meta
          property="og:description"
          content="Revolutionize your school's admissions process with intelligent AI that auto-captures, qualifies, and converts student leads. Trusted by leading educational institutions."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nyotafusionai.com" />
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
        <meta
          name="twitter:title"
          content="Nyota Fusion AI - AI-Powered School Admissions"
        />
        <meta
          name="twitter:description"
          content="Transform school admissions with AI. Auto-capture leads, increase conversion rates by 35%, and streamline enrollment processes."
        />
        <meta
          name="twitter:image"
          content="https://nyotafusionai.com/hero.jpg"
        />

        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#dc2626" />
        <link rel="canonical" href="https://nyotafusionai.com" />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Nyota Fusion AI",
            description:
              "AI-powered lead management platform for educational institutions to streamline admissions and increase enrollment conversion rates.",
            url: "https://nyotafusionai.com",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web Browser",
            offers: {
              "@type": "Offer",
              category: "Business Software",
            },
            creator: {
              "@type": "Organization",
              name: "Nyota Innovations",
              url: "https://nyotainnovations.com",
            },
          })}
        </script>
      </Helmet>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:justify-between">
            {/* Logo - Centered on mobile, left-aligned on desktop */}
            <div className="flex items-center justify-center md:justify-start w-full md:w-auto">
              <span className="text-2xl font-bold text-gray-900">
                Nyota Fusion AI
              </span>
            </div>
            {/* Navigation buttons - Hidden on mobile, visible on desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <RouterLink
                to="/login"
                className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 transition-colors whitespace-nowrap cursor-pointer no-underline"
              >
                Get Started
              </RouterLink>
              <RouterLink
                to="/login"
                className="border-2 border-red-800 text-red-800 px-4 py-2 rounded-lg hover:bg-red-800 hover:text-white transition-colors whitespace-nowrap cursor-pointer no-underline"
              >
                Live Demo
              </RouterLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-50 to-white overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage: `url('/hero.jpg')`,
          }}
        ></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Revolutionize Admissions with AI
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Auto-capture, qualify & convert student leads with intelligent
                automation that transforms your enrollment process
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <RouterLink
                  to="/login"
                  className="bg-red-800 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-900 transition-all duration-300 transform hover:scale-105 whitespace-nowrap cursor-pointer no-underline text-center"
                >
                  Get Started
                </RouterLink>
                <RouterLink
                  to="/login"
                  className="border-2 border-red-800 text-red-800 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-800 hover:text-white transition-all duration-300 whitespace-nowrap cursor-pointer no-underline text-center"
                >
                  Live Demo
                </RouterLink>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Lead Dashboard
                    </h3>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Live
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-800">
                        1,247
                      </div>
                      <div className="text-sm text-gray-600">Total Leads</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-800">
                        89%
                      </div>
                      <div className="text-sm text-gray-600">
                        Conversion Rate
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Qualified Leads</span>
                      <span>78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-800 h-2 rounded-full"
                        style={{ width: "78%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Schools Choose Nyota Fusion AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your admissions process with intelligent automation that
              works around the clock
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-bolt text-2xl text-red-800"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Instant Webhook Lead Capture
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Automatically capture and process leads from any source in
                real-time, ensuring no opportunity is missed
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-brain text-2xl text-red-800"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI Scoring & Routing
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Intelligent algorithms score and route leads to the right team
                members based on qualification criteria
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <i className="fas fa-chart-line text-2xl text-red-800"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Real-time Funnel Analytics
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get instant insights into your admissions funnel with
                comprehensive analytics and reporting
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get up and running in minutes with our simple four-step process
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center relative">
              <div className="w-16 h-16 bg-red-800 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-300 -translate-x-1/2"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Connect Lead Forms
              </h3>
              <p className="text-gray-600">
                Integrate your existing forms via webhook in just a few clicks
              </p>
            </div>
            <div className="text-center relative">
              <div className="w-16 h-16 bg-red-800 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-300 -translate-x-1/2"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Centralize & Tag Leads
              </h3>
              <p className="text-gray-600">
                All leads are automatically organized and tagged for easy
                management
              </p>
            </div>
            <div className="text-center relative">
              <div className="w-16 h-16 bg-red-800 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-300 -translate-x-1/2"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Auto-assign to Team
              </h3>
              <p className="text-gray-600">
                AI intelligently routes leads to the best available team member
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-800 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Track Conversions
              </h3>
              <p className="text-gray-600">
                Monitor every step of the journey with detailed analytics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Schools
            </h2>
            <p className="text-xl text-gray-600">
              See how educational institutions are transforming their admissions
              process
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-4 left-8">
              <i className="fas fa-quote-left text-4xl text-red-200"></i>
            </div>
            <div className="text-center">
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 italic">
                {testimonials[currentTestimonial].quote}
              </p>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <i
                    className={`${testimonials[currentTestimonial].icon} text-red-800`}
                  ></i>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonials[currentTestimonial].school}
                  </div>
                  <div className="text-gray-600">Educational Institution</div>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
                    index === currentTestimonial ? "bg-red-800" : "bg-gray-300"
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Admissions?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of schools already using AI to streamline their
            enrollment process
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <RouterLink
              to="/login"
              className="bg-white text-red-800 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer no-underline"
            >
              Get Started
            </RouterLink>
            <RouterLink
              to="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-red-800 transition-colors whitespace-nowrap cursor-pointer no-underline"
            >
              Live Demo
            </RouterLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Nyota Fusion AI</h3>
              <p className="text-gray-400 leading-relaxed">
                Revolutionizing school admissions with intelligent AI-powered
                lead management
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <RouterLink
                    to="/login"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer no-underline"
                  >
                    Get Started
                  </RouterLink>
                </li>
                <li>
                  <RouterLink
                    to="/login"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer no-underline"
                  >
                    Live Demo
                  </RouterLink>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <RouterLink
                    to="/privacy-policy"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer no-underline"
                  >
                    Privacy Policy
                  </RouterLink>
                </li>
                <li>
                  <RouterLink
                    to="/terms-of-service"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer no-underline"
                  >
                    Terms of Service
                  </RouterLink>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-400">
                © 2025 Nyota Fusion AI. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Powered by Nyota Innovations
              </p>
            </div>
            <div className="flex space-x-6">
              <a
                href="#twitter"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a
                href="#linkedin"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="fab fa-linkedin text-xl"></i>
              </a>
              <a
                href="#facebook"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <i className="fab fa-facebook text-xl"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
