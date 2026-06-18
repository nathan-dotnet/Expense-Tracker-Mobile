require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const prisma = require('./prisma/client');

const authRoutes     = require('./routes/auth');
const expenseRoutes  = require('./routes/expenses');
const budgetRoutes   = require('./routes/budgets');
const insightRoutes  = require('./routes/insights');
const reportRoutes   = require('./routes/reports');
const receiptRoutes  = require('./routes/receipts');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ── Parsing / Logging ─────────────────────────────────────
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static uploads ────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets',  budgetRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/reports',  reportRoutes);
app.use('/api/receipts', receiptRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start ─────────────────────────────────────────────────
async function main() {
  await prisma.$connect();
  console.log('✅ Connected to SQL Server via Prisma');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
