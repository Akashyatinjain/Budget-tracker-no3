# Budget Tracker

A full-stack budget tracker application with authentication, multi-currency support, analytics, budgets, subscriptions, notifications, friend loans, and transaction management.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Running the Application](#running-the-application)
- [Routes and API Endpoints](#routes-and-api-endpoints)
- [Deployment Notes](#deployment-notes)
- [Further Improvements](#further-improvements)

## Project Overview

This project is a personal finance and budget tracking web application built with a React frontend and an Express/PostgreSQL backend. It supports user authentication, budget tracking, transaction management, analytics, subscription and loan tracking, currency conversions, and real-time notifications.

## Key Features

- Email/password authentication
- Google OAuth sign-in
- Protected frontend routes for dashboard and user features
- Transaction creation, listing, and management
- Budget category tracking and budget notifications
- Analytics dashboard with charts and reports
- Currency and exchange features
- Subscription and recurring payment tracking
- Friend loans and split bill support
- Notifications and alerts
- EMI calculator page
- Responsive React UI with Tailwind CSS and animations

## Technology Stack

- Backend: Node.js, Express, PostgreSQL, Passport.js, JWT, bcrypt
- Frontend: React, Vite, React Router, Redux Toolkit, Tailwind CSS
- Database: PostgreSQL (via `pg`)
- Authentication: JWT cookies and Google OAuth
- Utilities: Axios, React Hot Toast, Recharts, Framer Motion, HTML2Canvas, jsPDF

## Project Structure

```
Budget-tracker/
  backend/
    config/db.js
    controllers/
    middlewares/
    models/
    routes/
    services/
    utils/
    server.js
  frontend/
    public/
    src/
      components/
      context/
      lib/
      pages/
      services/
      store/
    package.json
    vite.config.js
```

## Setup and Installation

1. Clone the repository.
2. Install backend dependencies.

```bash
cd backend
npm install
```

3. Install frontend dependencies.

```bash
cd ../frontend
npm install
```

4. Create environment variable files for backend and frontend.

## Backend Configuration

Create a `.env` file in the `backend/` folder with the following values:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:5000

# Use one of these connection methods:
DATABASE_URL=postgres://user:password@host:port/dbname
# OR
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_SSL=false

# Optional Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Important backend notes:

- `backend/config/db.js` supports either `DATABASE_URL` or individual `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASSWORD`, and `DB_PORT` values.
- `JWT_SECRET` is used for signing authentication tokens.
- `FRONTEND_URL` must match the frontend origin for OAuth redirect and CORS.
- `BASE_URL` is the backend base URL used for Google OAuth callback.

## Frontend Configuration

Create a `.env` file in the `frontend/` folder if you need to override the API base URL.

```env
VITE_BASE_URL=http://localhost:5000
# or
VITE_API_URL=http://localhost:5000
```

If not set, the frontend defaults to `http://localhost:5000`.

## Running the Application

### Start the backend

```bash
cd backend
npm run dev
```

### Start the frontend

```bash
cd frontend
npm run dev
```

Then open the frontend URL, usually `http://localhost:5173`.

## Routes and API Endpoints

### Backend API

- `POST /sign-up` - Register a new user
- `POST /sign-in` - Login with email/username and password
- `GET /auth/google` - Start Google OAuth sign-in
- `GET /auth/google/callback` - Google OAuth callback
- `GET /health` - Health check
- `GET /api/users/me` - Get current authenticated user
- `GET /api/transactions` - List user transactions
- `POST /api/transactions` - Create a transaction
- `POST /api/debug/create-budget-notif` - Create a debug budget notification
- `GET /api/budgets` - Budget management routes
- `GET /api/currencies` - Currency data routes
- `GET /api/subscriptions` - Subscription management routes
- `GET /api/reports` - Report generation routes
- `GET /api/notifications` - Notifications routes
- `GET /api/friend-loans` - Friend loans routes

### Frontend Pages

- `/` - Landing page
- `/sign-in` - Sign in page
- `/sign-up` - Register page
- `/forgot-password` - Forgot password page
- `/reset-password` - Reset password page
- `/dashboard` - Main user dashboard
- `/transactions` - Transaction management
- `/analytics` - Analytics dashboard
- `/budgets` - Budget tracking page
- `/currencies` - Currency features
- `/subscriptions` - Subscription tracking
- `/reports` - Reports page
- `/notifications` - Notification center
- `/settings` - User settings
- `/friend-loans` - Friend loans page
- `/emi-calculator` - EMI calculator
- `/split-bill` - Split bill page

## Deployment Notes

- Backend can be deployed to Node-friendly platforms like Render, Heroku, or Vercel Serverless functions.
- Frontend is a Vite app and can be deployed to Vercel, Netlify, or any static hosting.
- Ensure the backend `PORT`, `DATABASE_URL`/DB connection variables, and `JWT_SECRET` are configured in production.
- Set `FRONTEND_URL` to your deployed frontend origin.
- For Google OAuth, register the callback URL as `https://your-backend-domain.com/auth/google/callback`.

## Further Improvements

- Add proper database migrations and schema scripts
- Add unit tests for frontend and backend
- Improve form validation and error handling
- Add real currency conversion integration
- Add transaction export/import options
- Add user profile settings and avatar uploads

---

## Notes

This README is tailored for the current repository structure and uses the existing `backend/server.js`, `backend/config/db.js`, and `frontend/src/lib/api.js` configuration patterns.
