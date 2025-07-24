# Nyota AI Fusion Frontend

## Overview

Nyota AI Fusion is an AI-powered lead management platform designed specifically for educational institutions. It automates lead capture, qualification, and conversion through intelligent automation, multi-channel engagement including WhatsApp integration, and provides comprehensive analytics for enrollment growth.

## Live Website

🌐 **[https://nyotafusionai.com](https://nyotafusionai.com)**

## Prerequisites

- Node.js 20+
- npm or yarn
- Backend API service running

## Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/nyota-ai-fusion.git
cd nyota-ai-fusion/nyota-ai-fusion-frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Start the development server:

```bash
npm start
# or
yarn start
```

## Build for Production

```bash
npm run build
# or
yarn build
```

## Features

- **Modern UI/UX**: Built with Tailwind CSS for responsive, professional design
- **SEO Optimized**: Comprehensive meta tags, Open Graph, and Twitter Card support
- **User Authentication**: Secure login and role-based access control
- **AI Lead Management**: Intelligent lead capture, scoring, and qualification
- **WhatsApp Integration**: Direct messaging with leads via WhatsApp Business API
- **Multi-Channel Engagement**: Email, SMS, and social media integration
- **Advanced Analytics**: Real-time dashboards with conversion tracking
- **Team Collaboration**: Lead assignment and performance tracking
- **Organization Management**: Multi-tenant architecture for educational institutions
- **Social Media Ready**: Optimized sharing cards for all major platforms

## Technical Stack

- **Frontend Framework**: React.js 18+
- **Styling**: Tailwind CSS 3.4+ (migrated from Material-UI)
- **Routing**: React Router DOM
- **SEO**: React Helmet for meta tag management
- **Icons**: Font Awesome Pro
- **HTTP Client**: Axios
- **Charts**: Chart.js for analytics visualization
- **Authentication**: Firebase Authentication
- **Build Tool**: Create React App with Webpack

## Project Structure

```text
nyota-ai-fusion-frontend/
├── public/             # Static assets including hero.jpg for SEO
├── src/
│   ├── components/     # Reusable UI components (Tailwind CSS)
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components with SEO optimization
│   │   ├── auth/       # Authentication pages (Login, ForgotPassword)
│   │   ├── LandingPage.js    # Main public page with hero section
│   │   ├── PrivacyPolicy.js  # Legal compliance page
│   │   └── TermsOfService.js # Service agreement page
│   ├── services/       # API service layer
│   ├── theme/          # Tailwind theme configuration
│   ├── utils/          # Utility functions
│   ├── App.js          # Main application component
│   └── index.js        # Application entry point
├── tailwind.config.js  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
└── package.json        # Project dependencies and scripts
```

## Available Scripts

- `npm start`: Run the development server
- `npm run build`: Build the app for production
- `npm run test`: Run tests
- `npm run eject`: Eject from Create React App

## User Roles

1. **System Admin**: Access to all features and organizations
2. **Organization Admin**: Manage their organization's settings, team, and leads
3. **Lead Manager**: View and manage leads within their organization
4. **Customer Support**: Handle conversations with leads

## Technologies Used

- **React.js 18+** - Modern frontend framework
- **Tailwind CSS 3.4+** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **React Helmet** - SEO meta tag management
- **Font Awesome** - Icon library
- **Axios** - HTTP client for API calls
- **Chart.js** - Data visualization
- **Firebase Authentication** - Secure user authentication
- **PostCSS** - CSS processing and optimization

## SEO & Social Media Features

- **Comprehensive Meta Tags**: Title, description, keywords for all pages
- **Open Graph Protocol**: Rich previews for Facebook, LinkedIn, WhatsApp
- **Twitter Cards**: Optimized sharing for Twitter
- **Structured Data**: Schema.org markup for search engines
- **Canonical URLs**: Proper SEO indexing with nyotafusionai.com domain
- **Social Media Images**: Hero image (1440x1024) for all sharing cards
- **Mobile Optimization**: Responsive design with proper viewport settings

## Development Notes

- **Migration Completed**: Successfully migrated from Material-UI to Tailwind CSS
- **Legacy Support**: Uses `--legacy-peer-deps` for dependency resolution
- **SEO Ready**: All external pages optimized for search engines and social sharing
- **Performance**: Optimized images and CSS for fast loading
- **Accessibility**: WCAG compliant design patterns
