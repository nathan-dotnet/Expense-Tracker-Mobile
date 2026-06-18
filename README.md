# Expense Tracker with AI Insights

A cross-platform mobile expense tracker built with **React Native (Expo)** on the frontend and **Node.js + Express + SQL Server (Prisma)** on the backend.

## Features

- 🔐 JWT authentication (register/login)
- 💰 Expense management (create, edit, delete, search, filter)
- 📊 Budget tracking with real-time progress bars and alerts
- 📷 Receipt photo upload + OCR (Tesseract.js) with auto-amount detection
- 🤖 AI-generated monthly spending insights (Claude via Anthropic SDK)
- 📈 Monthly/yearly reports and category breakdowns
- 🎨 Clean, modern UI with charts (react-native-chart-kit)

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo), Redux Toolkit, React Navigation |
| Backend | Node.js, Express |
| Database | SQL Server (via SSMS) |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| OCR | Tesseract.js |
| AI | Anthropic Claude API |

## Project Structure

```
expense-tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (SQL Server)
│   ├── src/
│   │   ├── index.js            # Express entry point
│   │   ├── prisma/client.js    # Prisma client singleton
│   │   ├── middleware/auth.js  # JWT auth middleware
│   │   ├── routes/             # auth, expenses, budgets, insights, reports, receipts
│   │   └── utils/seed.js       # Demo data seeder
│   ├── uploads/                # Receipt image storage
│   ├── .env.example
│   └── package.json
└── mobile/
    ├── src/
    │   ├── screens/             # All app screens
    │   ├── components/          # Reusable UI components
    │   ├── navigation/          # Tab navigator
    │   ├── store/                # Redux slices (auth, expenses, budgets)
    │   ├── services/api.js      # Axios API client
    │   └── constants/theme.js   # Colors, categories, icons
    ├── App.js                   # Root navigation
    ├── app.json                 # Expo config
    └── package.json
```

---

## 1. Backend Setup (Node.js + Express + SQL Server)

### Prerequisites
- Node.js 18+
- SQL Server (Express, Developer, or full edition) + **SSMS** installed
- An Anthropic API key (for AI insights) — get one at console.anthropic.com

### Steps

```bash
cd backend
npm install
cp .env.example .env
```

### Configure SQL Server

1. Open **SSMS**, connect to your local SQL Server instance.
2. Create a new database:
   ```sql
   CREATE DATABASE ExpenseTracker;
   ```
3. Make sure **SQL Server Authentication** is enabled (or use Windows Auth — adjust connection string accordingly) and that **TCP/IP** is enabled in SQL Server Configuration Manager (default port 1433).
4. Update `.env` with your connection details:
   ```
   DATABASE_URL="sqlserver://localhost:1433;database=ExpenseTracker;user=sa;password=YourPassword123!;encrypt=false;trustServerCertificate=true"
   ```

### Run Prisma migrations

```bash
npm run db:generate     # generate Prisma client
npm run db:push         # push schema to SQL Server (creates tables)
```

> Use `npm run db:migrate` instead of `db:push` if you want versioned migration files for a production workflow.

### Seed demo data (optional)

```bash
npm run db:seed
```
This creates a demo user (`demo@expensetracker.com` / `demo1234`) with 3 months of sample expenses and budgets.

### Add your Anthropic API key

In `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Start the server

```bash
npm run dev      # nodemon, auto-reload
# or
npm start
```

Server runs at `http://localhost:3000`. Test it: `curl http://localhost:3000/health`

You can also inspect/edit data visually with:
```bash
npm run db:studio
```

---

## 2. Mobile Setup (React Native + Expo)

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (iOS/Android) **or** an emulator/simulator
- Same Wi-Fi network as your backend machine (for physical device testing)

### Steps

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env` and point it at your backend. **If testing on a physical phone**, use your computer's LAN IP, not `localhost`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api
```

Find your LAN IP:
- macOS/Linux: `ifconfig | grep inet`
- Windows: `ipconfig`

### Start Expo

```bash
npm start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a`/`i` to launch an Android/iOS emulator.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, get JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/expenses` | List expenses (filters: category, search, dates, pagination) |
| GET | `/api/expenses/summary` | Monthly category breakdown + daily trend |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/budgets` | List budgets with real-time spend % |
| POST | `/api/budgets` | Create/update a budget (upsert by category) |
| GET | `/api/insights` | Get/generate AI insight for a month (cached unless `?refresh=true`) |
| GET | `/api/reports/monthly` | Last N months overview |
| GET | `/api/reports/yearly` | Full year breakdown |
| POST | `/api/receipts/upload` | Upload receipt image, runs OCR, returns detected amount |

All endpoints except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

---

## Notes & Next Steps

- **Security**: change `JWT_SECRET` before deploying; never commit `.env`.
- **File storage**: receipts are stored on local disk under `backend/uploads/`. For production, swap in cloud storage (S3, Azure Blob) — the receipts route is structured so you can swap `multer.diskStorage` for a cloud storage engine with minimal changes.
- **OCR accuracy**: Tesseract.js works fully offline and free, but accuracy varies with receipt quality. For higher accuracy, consider swapping in a cloud OCR API (Google Vision, AWS Textract) using the same `/api/receipts/upload` contract.
- **Push notifications** for budget alerts aren't wired up yet — `expo-notifications` would be the natural next addition.
