# Expense Tracker with AI Insights

A cross-platform expense tracker built with **React Native + Expo** on the mobile app and **Node.js + Express + Prisma** on the backend. It supports expenses, budgets, receipt OCR, reports, profile preferences, and AI-generated spending insights.

## Features

- JWT authentication with register, login, and persistent sessions
- Expense create, edit, delete, search, category filters, and detail views
- Budget tracking with overall and category progress
- Currency preferences that update expenses, budgets, and insights
- Profile actions for editing name, changing currency, toggling notifications, viewing payment methods, and report summaries
- Receipt image upload with OCR amount detection
- AI monthly spending insights using Anthropic Claude
- Monthly and yearly reports with category breakdowns

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile | React Native, Expo, Redux Toolkit, React Navigation |
| Backend | Node.js, Express |
| Database | SQLite |
| ORM | Prisma |
| Auth | JWT, bcryptjs |
| OCR | Tesseract.js |
| AI | Anthropic Claude API |

## Project Structure

```text
expense-tracker/
+-- backend/
|   +-- prisma/
|   |   +-- schema.prisma
|   +-- src/
|   |   +-- index.js
|   |   +-- middleware/auth.js
|   |   +-- prisma/client.js
|   |   +-- routes/
|   |   +-- utils/seed.js
|   +-- uploads/
|   +-- .env.example
|   +-- package.json
+-- mobile/
    +-- src/
    |   +-- components/
    |   +-- constants/
    |   +-- navigation/
    |   +-- screens/
    |   +-- services/api.js
    |   +-- store/
    |   +-- utils/
    +-- App.js
    +-- app.json
    +-- package.json
```

## Backend Setup

### Prerequisites

- Node.js 18+
- An Anthropic API key for AI insights

### Install

```bash
cd backend
npm install
cp .env.example .env
```

Configure `.env`:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="change-me"
ANTHROPIC_API_KEY="sk-ant-..."
PORT=3000
```

### Database

```bash
npm run db:generate
npm run db:push
```

Optional demo data:

```bash
npm run db:seed
```

### Run Backend

```bash
npm run dev
```

The API runs at:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

## Mobile Setup

### Prerequisites

- Node.js 18+
- Expo Go on a phone, or an Android/iOS emulator
- Backend running locally or on a LAN-accessible machine

### Install

```bash
cd mobile
npm install
cp .env.example .env
```

Set the API URL in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

For a physical phone, replace `localhost` with your computer's LAN IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api
```

### Run Mobile App

```bash
npm start
```

Then scan the Expo QR code or launch an emulator.

## API Reference

All endpoints except register and login require:

```text
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/profile` | Update name, currency, or notification preference |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/expenses` | List expenses with filters and pagination |
| GET | `/api/expenses/summary` | Spending summary |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| DELETE | `/api/expenses` | Bulk delete expenses |
| GET | `/api/budgets` | List budgets with spend progress |
| POST | `/api/budgets` | Create or update a budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/insights` | Get or generate monthly AI insight |
| GET | `/api/insights?refresh=true` | Regenerate monthly AI insight |
| GET | `/api/reports/monthly` | Last N months report |
| GET | `/api/reports/yearly` | Yearly report |
| POST | `/api/receipts/upload` | Upload receipt and run OCR |
| DELETE | `/api/receipts/:filename` | Delete receipt |

## Profile Behavior

The Profile tab includes:

- Edit Profile: update display name and open currency selection
- Payment Methods: view supported payment method labels used by expenses
- Notifications: toggle the saved notification preference
- Export Reports: fetch monthly/yearly report data and show a summary
- Privacy & Security: quick account security information
- Help & Support: quick app usage guidance

Changing currency updates the user profile, refreshes Redux state, updates budget/expense display symbols, and clears cached insights so new AI text uses the selected currency.

## Notes

- Do not commit `.env` files or real API keys.
- Receipt images are stored locally under `backend/uploads/`.
- OCR quality depends on receipt image clarity.
- AI insights require a valid `ANTHROPIC_API_KEY`; the backend falls back to a basic placeholder if AI generation fails.
- Push notifications are not fully implemented yet; the profile switch currently saves the user's preference.
