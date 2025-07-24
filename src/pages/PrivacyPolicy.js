import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Helmet } from "react-helmet";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>
          Privacy Policy - Nyota Fusion AI | Data Protection & Privacy Rights
        </title>
        <meta
          name="description"
          content="Learn how Nyota Fusion AI protects your privacy and handles data. Comprehensive privacy policy covering data collection, usage, and your rights as a user."
        />
        <meta
          name="keywords"
          content="privacy policy, data protection, Nyota Fusion AI, user privacy, GDPR compliance, data security, educational technology privacy"
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Privacy Policy - Nyota Fusion AI" />
        <meta
          property="og:description"
          content="Comprehensive privacy policy detailing how we protect your data and respect your privacy rights."
        />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content="https://nyotafusionai.com/privacy-policy"
        />
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
        <meta name="twitter:title" content="Privacy Policy - Nyota Fusion AI" />
        <meta
          name="twitter:description"
          content="Comprehensive privacy policy detailing how we protect your data and respect your privacy rights."
        />
        <meta
          name="twitter:image"
          content="https://nyotafusionai.com/hero.jpg"
        />

        <link rel="canonical" href="https://nyotafusionai.com/privacy-policy" />
      </Helmet>

      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <RouterLink
              to="/"
              className="text-2xl font-bold text-gray-900 no-underline"
            >
              Nyota Fusion AI
            </RouterLink>
            <RouterLink
              to="/"
              className="text-gray-700 hover:text-gray-900 transition-colors cursor-pointer no-underline"
            >
              Back to Home
            </RouterLink>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-8">Last updated: January 24, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nyota Fusion AI ("we," "our," or "us") is committed to protecting
              your privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              AI-powered lead management platform and related services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our services, you agree to the collection and use of
              information in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We Collect
            </h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              2.1 Personal Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may collect personally identifiable information that you
              voluntarily provide to us when you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Register for an account</li>
              <li>Use our services</li>
              <li>Contact us for support</li>
              <li>Subscribe to our newsletters</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">
              2.2 Lead Data
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Through our platform, we process lead information including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Contact information (names, emails, phone numbers)</li>
              <li>Inquiry details and communications</li>
              <li>Interaction history and preferences</li>
              <li>Lead scoring and qualification data</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">
              2.3 Usage Data
            </h3>
            <p className="text-gray-700 leading-relaxed">
              We automatically collect certain information when you access our
              services, including IP addresses, browser types, operating
              systems, and usage patterns.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>
                Provide and maintain our AI-powered lead management services
              </li>
              <li>Process and qualify leads using our AI algorithms</li>
              <li>Improve our services and develop new features</li>
              <li>Communicate with you about your account and our services</li>
              <li>Provide customer support</li>
              <li>Comply with legal obligations</li>
              <li>Protect against fraud and unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Data Sharing and Disclosure
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information only in the following
              circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or court orders</li>
              <li>To protect our rights, property, or safety</li>
              <li>
                In connection with a business transaction (merger, acquisition,
                etc.)
              </li>
              <li>
                With trusted service providers who assist in operating our
                platform
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security
              measures to protect your information against unauthorized access,
              alteration, disclosure, or destruction. This includes encryption,
              secure servers, access controls, and regular security assessments.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Data Retention
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information only for as long as necessary to
              provide our services and fulfill the purposes outlined in this
              Privacy Policy, unless a longer retention period is required by
              law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Your Rights
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding
              your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate information</li>
              <li>Deletion of your personal information</li>
              <li>Portability of your data</li>
              <li>Objection to processing</li>
              <li>Restriction of processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. International Data Transfers
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              to protect your information in accordance with this Privacy
              Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new Privacy
              Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@nyotafusion.ai
              </p>
              <p className="text-gray-700">
                <strong>Address:</strong> Nyota Fusion AI, Kampala, Uganda
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Nyota Fusion AI. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Powered by Nyota Innovations
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
