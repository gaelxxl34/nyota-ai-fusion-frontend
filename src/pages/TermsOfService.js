import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Helmet } from "react-helmet";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>
          Terms of Service - Nyota Fusion AI | Service Agreement & User Terms
        </title>
        <meta
          name="description"
          content="Read the Terms of Service for Nyota Fusion AI. Understand your rights and responsibilities when using our AI-powered lead management platform for educational institutions."
        />
        <meta
          name="keywords"
          content="terms of service, user agreement, Nyota Fusion AI, service terms, legal agreement, platform usage, educational technology terms"
        />
        <meta name="robots" content="index, follow" />
        <meta
          property="og:title"
          content="Terms of Service - Nyota Fusion AI"
        />
        <meta
          property="og:description"
          content="Service agreement and user terms for the AI-powered lead management platform."
        />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content="https://nyotafusionai.com/terms-of-service"
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
        <meta
          name="twitter:title"
          content="Terms of Service - Nyota Fusion AI"
        />
        <meta
          name="twitter:description"
          content="Service agreement and user terms for the AI-powered lead management platform."
        />
        <meta
          name="twitter:image"
          content="https://nyotafusionai.com/hero.jpg"
        />

        <link
          rel="canonical"
          href="https://nyotafusionai.com/terms-of-service"
        />
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
          Terms of Service
        </h1>
        <p className="text-gray-600 mb-8">Last updated: January 24, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Nyota Fusion AI's services, you accept and
              agree to be bound by the terms and provision of this agreement. If
              you do not agree to abide by the above, please do not use this
              service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nyota Fusion AI provides an AI-powered lead management platform
              that helps educational institutions and businesses:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Capture and process leads in real-time</li>
              <li>Automatically qualify and score leads using AI algorithms</li>
              <li>Route leads to appropriate team members</li>
              <li>Provide analytics and insights on lead conversion</li>
              <li>Integrate with messaging platforms like WhatsApp</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. User Accounts and Registration
            </h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              3.1 Account Creation
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use our services, you must create an account by providing
              accurate, current, and complete information. You are responsible
              for maintaining the confidentiality of your account credentials.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">
              3.2 Account Responsibility
            </h3>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for all activities that occur under your
              account. You must immediately notify us of any unauthorized use of
              your account or any other breach of security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Acceptable Use Policy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to use our services to:
            </p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>
                Transmit spam, unsolicited communications, or malicious content
              </li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt our services</li>
              <li>Use our services for illegal or fraudulent activities</li>
              <li>Reverse engineer or attempt to extract source code</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Data and Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your use of our services is also governed by our Privacy Policy.
              By using our services, you consent to our collection, use, and
              disclosure of your information as described in our Privacy Policy.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You retain ownership of any data you submit to our platform. You
              grant us a license to use, process, and analyze this data solely
              for the purpose of providing our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Service Availability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We strive to maintain high service availability but do not
              guarantee uninterrupted access to our services. We may temporarily
              suspend access for maintenance, updates, or due to circumstances
              beyond our control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Subscription and Payment
            </h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">
              7.1 Subscription Plans
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our services are provided on a subscription basis. Subscription
              fees are charged in advance and are non-refundable except as
              required by law.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">
              7.2 Payment Terms
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to pay all fees associated with your subscription.
              Failure to pay may result in suspension or termination of your
              account.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">
              7.3 Cancellation
            </h3>
            <p className="text-gray-700 leading-relaxed">
              You may cancel your subscription at any time. Cancellation will
              take effect at the end of your current billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Intellectual Property
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our services, including all software, algorithms, designs, and
              content, are protected by intellectual property laws. You may not
              copy, modify, distribute, or create derivative works without our
              express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, Nyota Fusion AI shall not
              be liable for any indirect, incidental, special, consequential, or
              punitive damages, including but not limited to loss of profits,
              data, or use, even if we have been advised of the possibility of
              such damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Disclaimer of Warranties
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are provided "as is" and "as available" without
              warranties of any kind, either express or implied. We do not
              warrant that our services will be error-free, secure, or
              uninterrupted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Termination
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account and access to our
              services at any time, with or without cause or notice, for conduct
              that we believe violates these Terms of Service or is harmful to
              other users or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Governing Law
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service shall be governed by and construed in
              accordance with the laws of Uganda, without regard to its conflict
              of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Changes to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time.
              We will notify users of material changes via email or through our
              platform. Continued use of our services after such changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              14. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@nyotafusion.ai
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

export default TermsOfService;
