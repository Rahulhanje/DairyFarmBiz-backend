# 🥛 DairyFarm Biz - Backend API

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)

> A comprehensive RESTful API for dairy farm management system built with Node.js, Express, TypeScript, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core Modules
- 🔐 **Authentication** - JWT-based auth, email verification, password reset
- 🐄 **Animal Management** - Complete cattle inventory tracking
- 🥛 **Milk Collection** - Session-wise collection with automatic calculations
- 💰 **Financial Management** - Expenses, revenue, profit/loss analysis
- 🧬 **Breeding Management** - Insemination and pregnancy tracking
- 📊 **Dashboard Analytics** - Real-time metrics and trends
- 📥 **Excel Reports** - Multi-sheet reports with custom date ranges
- 🔔 **Notifications** - Email and WhatsApp alerts

## 🛠 Tech Stack

- **Runtime**: Node.js 22.x
- **Language**: TypeScript 5.3
- **Framework**: Express.js
- **Database**: MongoDB 8.0 + Mongoose
- **Auth**: JWT + bcrypt
- **Email**: Nodemailer
- **Excel**: ExcelJS
- **Validation**: express-validator, Zod

## 📦 Prerequisites

- Node.js v22.x or higher
- MongoDB v8.0 or higher (or MongoDB Atlas)
- npm v10.x or higher

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/Rahulhanje/DairyFarmBiz-backend.git
cd DairyFarmBiz-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build TypeScript
npm run build
```

## 🔧 Environment Variables

```env
# Application
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/dairyfarm

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS
CORS_ORIGIN=http://localhost:8080
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🏃 Running the Application

```bash
# Development (with auto-reload)
npm run dev

# Production
npm run build
npm start

# Linting
npm run lint
```

Server runs on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register user |
| POST | `/auth/login` | User login |
| POST | `/auth/verify-email` | Verify email OTP |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/profile` | Update profile |

### Animals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/animals` | List animals |
| POST | `/animals` | Add animal |
| GET | `/animals/:id` | Get details |
| PUT | `/animals/:id` | Update animal |
| DELETE | `/animals/:id` | Delete animal |

### Milk Collection

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/milk-collection` | List collections |
| POST | `/milk-collection` | Add collection |
| PUT | `/milk-collection/:id` | Update |
| DELETE | `/milk-collection/:id` | Delete |

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses` | List expenses |
| POST | `/expenses` | Add expense |
| PUT | `/expenses/:id` | Update |
| DELETE | `/expenses/:id` | Delete |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Dashboard data |
| GET | `/dashboard/milk-trends` | Milk trends |
| GET | `/dashboard/expense-trends` | Expense trends |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/weekly` | Weekly report |
| GET | `/reports/monthly` | Monthly report |
| GET | `/reports/total` | All-time report |
| GET | `/reports/custom?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Custom report |

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration
│   ├── middlewares/         # Express middlewares
│   ├── modules/             # Feature modules
│   │   ├── auth/
│   │   ├── animal/
│   │   ├── milk-collection/
│   │   ├── expense/
│   │   ├── breeding/
│   │   ├── dashboard/
│   │   └── report/
│   ├── types/               # TypeScript types
│   ├── utils/               # Utilities
│   ├── app.ts              # Express setup
│   └── server.ts           # Entry point
├── dist/                    # Compiled JS
├── .env.example            # Example env file
├── package.json
└── tsconfig.json
```

## 🚀 Deployment

### Render.com

1. Create Web Service
2. Connect GitHub repository
3. Configure:
   - Build: `npm install && npm run build`
   - Start: `npm start`
4. Add environment variables
5. Deploy

### MongoDB Atlas

1. Create free cluster
2. Whitelist IP: `0.0.0.0/0`
3. Get connection string
4. Update `MONGODB_URI` in env

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/DairyFarmBiz-backend.git

# Add upstream
git remote add upstream https://github.com/Rahulhanje/DairyFarmBiz-backend.git

# Create branch
git checkout -b feature/your-feature-name
```

### Code Guidelines

- Use TypeScript strict mode
- Follow existing patterns
- Write meaningful commit messages
- Add JSDoc comments
- Keep functions small

### Commit Convention

```
feat: add new feature
fix: bug fix
docs: documentation
refactor: code refactoring
test: add tests
```

### Pull Request Process

1. Update your branch with upstream
2. Run `npm run lint` and `npm run build`
3. Push changes
4. Create PR with clear description
5. Wait for review

### Reporting Issues

Create GitHub issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## 📄 License

Private and proprietary. All rights reserved.

## 👥 Author

**Rahul Hanje** - [@Rahulhanje](https://github.com/Rahulhanje)

---

**Made with ❤️ for dairy farmers**
