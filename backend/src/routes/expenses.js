const express = require('express');
const { body, validationResult } = require('express-validator');
const { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } = require('date-fns');
const prisma  = require('../prisma/client');
const auth    = require('../middleware/auth');

const router = express.Router();

// ── GET /api/expenses ─────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      category, startDate, endDate,
      minAmount, maxAmount,
      paymentMethod, search,
      sortBy = 'date', sortOrder = 'desc',
      period,
    } = req.query;

    const where = { userId: req.userId };

    if (category)      where.category      = category;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { notes: { contains: search } },
        { tags:  { contains: search } },
      ];
    }

    // Date range from period shortcut
    if (period) {
      const now = new Date();
      const ranges = {
        week:  [startOfWeek(now),  endOfWeek(now)],
        month: [startOfMonth(now), endOfMonth(now)],
        year:  [startOfYear(now),  endOfYear(now)],
      };
      if (ranges[period]) {
        where.date = { gte: ranges[period][0], lte: ranges[period][1] };
      }
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate)   where.date.lte = new Date(endDate);
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const take  = parseInt(limit);
    const orderBy = { [sortBy]: sortOrder };

    const [expenses, total] = await prisma.$transaction([
      prisma.expense.findMany({ where, orderBy, skip, take }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/expenses/summary ─────────────────────────────
router.get('/summary', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const targetYear  = parseInt(year)  || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate   = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId, date: { gte: startDate, lte: endDate } },
      select: { amount: true, category: true, date: true },
    });

    // Category breakdown
    const categoryMap = {};
    expenses.forEach((e) => {
      const cat = e.category;
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, total: 0, count: 0 };
      categoryMap[cat].total += parseFloat(e.amount);
      categoryMap[cat].count += 1;
    });
    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.total - a.total);

    // Daily trend
    const dailyMap = {};
    expenses.forEach((e) => {
      const day = e.date.toISOString().split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = { date: day, total: 0 };
      dailyMap[day].total += parseFloat(e.amount);
    });
    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    res.json({
      success: true,
      data: { categoryBreakdown, dailyTrend, total, count: expenses.length, period: { year: targetYear, month: targetMonth } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/expenses/:id ─────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/expenses ────────────────────────────────────
router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').optional().isISO8601().withMessage('Valid date required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { title, amount, currency, category, date, notes, tags, isRecurring, recurringInterval, paymentMethod } = req.body;

      const expense = await prisma.expense.create({
        data: {
          userId: req.userId,
          title,
          amount: parseFloat(amount),
          currency: currency || req.user.currency || 'USD',
          category,
          date: date ? new Date(date) : new Date(),
          notes,
          tags: Array.isArray(tags) ? tags.join(',') : tags,
          isRecurring: isRecurring || false,
          recurringInterval: recurringInterval || null,
          paymentMethod: paymentMethod || 'other',
        },
      });

      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ── PUT /api/expenses/:id ─────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Expense not found' });

    const { title, amount, currency, category, date, notes, tags, isRecurring, recurringInterval, paymentMethod } = req.body;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(title            !== undefined && { title }),
        ...(amount           !== undefined && { amount: parseFloat(amount) }),
        ...(currency         !== undefined && { currency }),
        ...(category         !== undefined && { category }),
        ...(date             !== undefined && { date: new Date(date) }),
        ...(notes            !== undefined && { notes }),
        ...(tags             !== undefined && { tags: Array.isArray(tags) ? tags.join(',') : tags }),
        ...(isRecurring      !== undefined && { isRecurring }),
        ...(recurringInterval !== undefined && { recurringInterval }),
        ...(paymentMethod    !== undefined && { paymentMethod }),
      },
    });

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/expenses/:id ──────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Expense not found' });

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── DELETE /api/expenses (bulk) ───────────────────────────
router.delete('/', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'No IDs provided' });

    const result = await prisma.expense.deleteMany({ where: { id: { in: ids }, userId: req.userId } });
    res.json({ success: true, deletedCount: result.count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
