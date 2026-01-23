# 🐄 Dairy Farm Management System - Backend API

A comprehensive REST API for managing dairy farm operations including animals, milk collection, expenses, breeding, notifications, and reporting.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **Email:** Nodemailer
- **Scheduling:** node-cron

## 📁 Project Structure

```
src/
├── config/
│   ├── index.ts          # Environment configuration
│   └── db.ts             # MongoDB connection
├── middlewares/
│   ├── auth.ts           # JWT authentication
│   ├── errorHandler.ts   # Central error handling
│   ├── validate.ts       # Request validation
│   ├── requestLogger.ts  # Request logging
│   ├── rateLimiter.ts    # Rate limiting
│   ├── sanitize.ts       # Input sanitization
│   └── index.ts          # Middleware exports
├── modules/
│   ├── auth/             # Authentication module
│   ├── animal/           # Animal management
│   ├── milk-rate/        # Milk rate management
│   ├── milk-collection/  # Milk collection entries
│   ├── expense/          # Expense tracking
│   ├── breeding/         # Artificial insemination
│   ├── pregnancy-status/ # Pregnancy status timeline
│   ├── notification/     # Notifications & email
│   └── dashboard/        # Reports & analytics
├── utils/
│   ├── ApiError.ts       # Custom error classes
│   ├── asyncHandler.ts   # Async error wrapper
│   ├── responseHandler.ts# Standardized responses
│   ├── cronJobs.ts       # Scheduled tasks
│   └── helpers.ts        # Utility functions
├── types/
│   └── index.ts          # TypeScript definitions
├── app.ts                # Express application
└── server.ts             # Server entry point
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/dairy_farm_db
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Email Configuration (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=noreply@dairyfarm.com
   EMAIL_FROM_NAME=Dairy Farm Management
   NOTIFICATION_EMAIL=admin@dairyfarm.com
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication

All protected routes require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Auth Module

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/me` | Get current user | Yes |

### Signup
```json
POST /auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "admin"
}
```

### Login
```json
POST /auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 🐄 Animal Module

Manage cows and buffaloes with unique serial numbers per animal type.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/animals` | Create animal |
| GET | `/animals` | List all animals |
| GET | `/animals/:id` | Get animal by ID |
| PUT | `/animals/:id` | Update animal |
| DELETE | `/animals/:id` | Soft delete animal |
| PATCH | `/animals/:id/sell` | Mark as sold |

### Create Animal
```json
POST /animals
{
  "serialNumber": "COW001",
  "animalType": "cow",
  "nickName": "Lakshmi",
  "breed": "Holstein",
  "gender": "female",
  "dateOfBirth": "2022-01-15",
  "purchaseDate": "2023-06-01",
  "purchasePrice": 50000
}
```

### Sell Animal
```json
PATCH /animals/:id/sell
{
  "sellingDate": "2026-01-20",
  "sellingPrice": 55000,
  "sellingReason": "Old age"
}
```

### Query Parameters
- `animalType` - Filter by cow/buffalo
- `gender` - Filter by male/female
- `isActive` - Filter active animals
- `isSold` - Filter sold animals
- `page`, `limit` - Pagination

---

## 💰 Milk Rate Module

Manage milk rates with immutable historical rates.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/milk-rates` | Create new rate |
| GET | `/milk-rates` | List all rates |
| GET | `/milk-rates/current` | Get current rates |
| GET | `/milk-rates/:id` | Get rate by ID |
| GET | `/milk-rates/lookup` | Get rate for date |

### Create Rate
```json
POST /milk-rates
{
  "animalType": "cow",
  "ratePerLiter": 55,
  "effectiveFrom": "2026-01-01"
}
```

### Rate Lookup
```
GET /milk-rates/lookup?animalType=cow&date=2026-01-15
```

**Note:** Old rates cannot be edited or deleted (immutable for historical accuracy).

---

## 🥛 Milk Collection Module

Record daily milk collections with auto-calculated amounts.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/milk-collection` | Create entry |
| GET | `/milk-collection` | List entries |
| GET | `/milk-collection/:id` | Get by ID |
| PUT | `/milk-collection/:id` | Update entry |
| DELETE | `/milk-collection/:id` | Delete entry |
| GET | `/milk-collection/summary` | Get summary |

### Create Entry
```json
POST /milk-collection
{
  "date": "2026-01-23",
  "session": "morning",
  "animalType": "cow",
  "quantity": 50
}
```

**Features:**
- Auto-fetches current rate from milk-rate module
- Auto-calculates `totalAmount = quantity × ratePerLiter`
- Unique constraint: one entry per date + session + animalType

### Query Parameters
- `animalType` - cow/buffalo
- `session` - morning/evening
- `startDate`, `endDate` - Date range filter
- `page`, `limit` - Pagination

---

## 💸 Expense Module

Track farm expenses with categorization.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/expenses` | Create expense |
| GET | `/expenses` | List expenses |
| GET | `/expenses/:id` | Get by ID |
| PUT | `/expenses/:id` | Update expense |
| DELETE | `/expenses/:id` | Delete expense |
| GET | `/expenses/summary` | Get summary by category |

### Create Expense
```json
POST /expenses
{
  "category": "feed",
  "amount": 5000,
  "description": "Purchased cattle feed",
  "date": "2026-01-23"
}
```

**Categories:** feed, medicine, equipment, labor, maintenance, transport, other

### Query Parameters
- `category` - Filter by category
- `startDate`, `endDate` - Date range
- `minAmount`, `maxAmount` - Amount range
- `page`, `limit` - Pagination

---

## 🧬 Breeding Module

Track artificial insemination and pregnancy.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/breeding` | Create insemination record |
| GET | `/breeding` | List all records |
| GET | `/breeding/:id` | Get by ID |
| PUT | `/breeding/:id` | Update record |
| DELETE | `/breeding/:id` | Delete record |
| PATCH | `/breeding/:id/status` | Update pregnancy status |
| GET | `/breeding/animal/:animalId` | Get by animal |
| GET | `/breeding/pending-checks` | Get pending pregnancy checks |

### Create Insemination
```json
POST /breeding
{
  "animalId": "animal_object_id",
  "inseminationDate": "2026-01-23",
  "doctorName": "Dr. Smith",
  "semenType": "Frozen",
  "breed": "Jersey",
  "notes": "First attempt"
}
```

**Features:**
- Auto-calculates `pregnancyCheckDate` (inseminationDate + 90 days)
- Prevents insemination for sold/inactive animals
- Only female animals allowed

### Update Status
```json
PATCH /breeding/:id/status
{
  "status": "pregnant_confirmed",
  "notes": "Confirmed by vet"
}
```

**Status Flow:**
```
check_pending → pregnant_confirmed → delivered
                ↘ failed
```

---

## 📊 Pregnancy Status Module

Maintain detailed pregnancy status timeline.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pregnancy-status` | Add status to timeline |
| GET | `/pregnancy-status` | List all history |
| GET | `/pregnancy-status/insemination/:id` | Timeline for insemination |
| GET | `/pregnancy-status/animal/:id` | History for animal |
| GET | `/pregnancy-status/current/:id` | Current status |
| GET | `/pregnancy-status/statistics` | Status statistics |
| GET | `/pregnancy-status/transitions/:status` | Valid transitions |

### Add Status
```json
POST /pregnancy-status
{
  "inseminationId": "insemination_object_id",
  "status": "pregnant_confirmed",
  "notes": "Ultrasound confirmed"
}
```

**Features:**
- No overwriting - each change creates new history entry
- Validates logical status transitions
- Delivery requires `deliveryDate`, optional `calfCount`, `calfDetails`

---

## 🔔 Notification Module

Manage notifications with email support.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications` | Create notification |
| GET | `/notifications` | List notifications |
| GET | `/notifications/:id` | Get by ID |
| PUT | `/notifications/:id` | Update notification |
| DELETE | `/notifications/:id` | Delete notification |
| PATCH | `/notifications/:id/cancel` | Cancel notification |
| POST | `/notifications/:id/send` | Send immediately |
| POST | `/notifications/process-pending` | Process all pending |
| POST | `/notifications/pregnancy-reminders` | Create pregnancy reminders |
| GET | `/notifications/statistics` | Notification stats |
| GET | `/notifications/email-status` | Email service status |
| POST | `/notifications/test-email` | Send test email |
| GET | `/notifications/cron-status` | Cron job status |
| POST | `/notifications/run-cron` | Trigger cron manually |

### Create Notification
```json
POST /notifications
{
  "animalId": "animal_object_id",
  "inseminationId": "insemination_object_id",
  "type": "pregnancy_check",
  "channel": "email",
  "scheduledDate": "2026-04-23",
  "message": "Pregnancy check due for COW001",
  "subject": "Pregnancy Check Reminder",
  "recipientEmail": "farmer@example.com"
}
```

**Types:** pregnancy_check, vaccination, breeding_reminder, general  
**Channels:** email, sms, push, in_app  
**Status:** pending, sent, failed, cancelled

### Cron Job
- Runs daily at 8:00 AM
- Finds pending inseminations past pregnancy check date
- Creates and sends email notifications
- Skips if pregnancy confirmed/failed or animal sold

---

## 📈 Dashboard Module

Aggregated reports and analytics.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Complete dashboard |
| GET | `/dashboard/milk-trends` | Milk collection trends |
| GET | `/dashboard/expense-trends` | Expense trends |
| GET | `/dashboard/profit-loss-trends` | Profit/loss over time |
| GET | `/dashboard/cow-milk` | Cow milk summary |
| GET | `/dashboard/buffalo-milk` | Buffalo milk summary |
| GET | `/dashboard/animal-stats` | Animal statistics |
| GET | `/dashboard/breeding-stats` | Breeding statistics |

### Query Parameters
- `period` - daily, weekly, monthly, yearly, custom
- `startDate` - Start date for custom range
- `endDate` - End date for custom range

### Dashboard Summary Response
```json
{
  "dateRange": { "startDate": "2026-01-01", "endDate": "2026-01-23" },
  "period": "monthly",
  "milk": {
    "cow": {
      "totalQuantity": 1500,
      "totalAmount": 82500,
      "avgRate": 55,
      "sessions": {
        "morning": { "quantity": 800, "amount": 44000 },
        "evening": { "quantity": 700, "amount": 38500 }
      }
    },
    "buffalo": {
      "totalQuantity": 800,
      "totalAmount": 56000,
      "avgRate": 70,
      "sessions": { ... }
    },
    "total": { "quantity": 2300, "amount": 138500 }
  },
  "expenses": {
    "total": 45000,
    "byCategory": {
      "feed": 25000,
      "medicine": 8000,
      "labor": 12000
    }
  },
  "profitLoss": {
    "totalIncome": 138500,
    "totalExpenses": 45000,
    "netProfit": 93500,
    "profitMargin": 67.51
  },
  "animals": {
    "totalCows": 15,
    "totalBuffaloes": 8,
    "activeCows": 12,
    "activeBuffaloes": 8,
    "soldAnimals": 3
  },
  "breeding": {
    "totalInseminations": 5,
    "pendingChecks": 2,
    "confirmed": 2,
    "failed": 0,
    "delivered": 1
  }
}
```

---

## 🛡️ Security Features

### Rate Limiting
- **API Routes:** 60 requests per minute
- **Auth Routes:** 10 requests per 15 minutes
- Returns `429 Too Many Requests` when exceeded

### Input Sanitization
- Removes null bytes
- Strips MongoDB operators (`$`)
- Prevents NoSQL injection

### Request Validation
- All inputs validated using express-validator
- Returns `422 Unprocessable Entity` with field-specific errors

### Authentication
- JWT tokens with configurable expiration
- Passwords hashed with bcrypt (12 rounds)
- Protected routes require valid Bearer token

---

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

---

## 🔧 Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript
npm start        # Start production server
npm run lint     # Run ESLint
npm run lint:fix # Fix linting issues
```

---

## 📊 Health Check

```
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Dairy Farm API is running",
  "timestamp": "2026-01-23T10:30:00.000Z"
}
```

---

## 🗓️ Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Daily Notifications | 8:00 AM | Processes pending pregnancy check reminders |

---

## 📝 License

MIT License

---

## 👨‍💻 Author

Dairy Farm Management System
