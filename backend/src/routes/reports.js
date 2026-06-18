const express = require('express');
const { startOfMonth, endOfMonth, subMonths, format } = require('date-fns');
const prisma  = require('../prisma/client');
const auth    = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/monthly — last N months overview
router.get('/monthly', auth, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const now    = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const refDate = subMonths(now, i);
      const start   = startOfMonth(refDate);
      const end     = endOfMonth(refDate);

      const expenses = await prisma.expense.findMany({
        where: { userId: req.userId, date: { gte: start, lte: end } },
        select: { amount: true, category: true },
      });

      const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
      const byCategory = {};
      expenses.forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
      });

      result.push({
        year:       refDate.getFullYear(),
        month:      refDate.getMonth() + 1,
        label:      format(refDate, 'MMM yyyy'),
        total,
        count:      expenses.length,
        byCategory,
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/yearly — full year breakdown
router.get('/yearly', auth, async (req, res) => {
  try {
    const year  = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end   = new Date(year, 11, 31, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId, date: { gte: start, lte: end } },
      select: { amount: true, category: true, date: true },
    });

    const byMonth = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: format(new Date(year, i, 1), 'MMM'),
      total: 0,
      count: 0,
    }));

    const byCategory = {};
    expenses.forEach((e) => {
      const m = new Date(e.date).getMonth();
      byMonth[m].total += parseFloat(e.amount);
      byMonth[m].count += 1;
      byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
    });

    const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

    res.json({
      success: true,
      data: {
        year, total,
        count: expenses.length,
        byMonth,
        byCategory: Object.entries(byCategory)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
