# Nyota AI Fusion Frontend

## Overview

Nyota AI Fusion is a lead management platform with AI-powered features to automate lead qualification, engage with leads via multiple channels including WhatsApp, and provide advanced analytics for business growth.

## Prerequisites

- Node.js 16+
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

- **User Authentication**: Secure login and role-based access control
- **Lead Management Dashboard**: Centralized view of all leads with filtering and search capabilities
- **Lead Qualification**: Automatic scoring and qualification of leads
- **WhatsApp Integration**: Direct messaging with leads via WhatsApp
- **Analytics**: Comprehensive analytics dashboard with visualizations
- **Team Management**: Assign leads to team members and track performance
- **Organization Management**: Multi-organization support for admin users

## Project Structure

```
nyota-ai-fusion-frontend/
├── public/             # Static files
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── theme/          # Theme configuration
│   ├── utils/          # Utility functions
│   ├── App.js          # Main application component
│   └── index.js        # Application entry point
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

- React.js
- Material-UI
- React Router
- Axios
- Chart.js
- Firebase Authentication
