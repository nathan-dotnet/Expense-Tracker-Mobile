const express = require('express');
const prisma  = require('../prisma/client');
const auth    = require('../middleware/auth');

const router = express.Router();

// GET /api/budgets — with real-time spend computed
router.get('/', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const targetYear  = parseInt(year)  || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;

    const budgets = await prisma.budget.findMany({
      where: { userId: req.userId, isActive: true },
    });

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate   = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Get actual spending per category this period
    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId, date: { gte: startDate, lte: endDate } },
      select: { amount: true, category: true },
    });

    const spendByCategory = {};
    expenses.forEach((e) => {
      spendByCategory[e.category] = (spendByCategory[e.category] || 0) + parseFloat(e.amount);
    });
    const totalSpend = Object.values(spendByCategory).reduce((s, v) => s + v, 0);

    const enriched = budgets.map((b) => {
      const spent = b.category === 'Total' ? totalSpend : (spendByCategory[b.category] || 0);
      const percentage = parseFloat(b.amount) > 0 ? (spent / parseFloat(b.amount)) * 100 : 0;
      return {
        ...b,
        amount: parseFloat(b.amount),
        spent,
        remaining: parseFloat(b.amount) - spent,
        percentage: Math.round(percentage * 10) / 10,
        isOverBudget: spent > parseFloat(b.amount),
        isNearLimit: percentage >= b.alertThreshold && percentage < 100,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/budgets
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, period, month, year, alertThreshold } = req.body;

    // Upsert: one budget per category per period
    const existing = await prisma.budget.findFirst({
      where: { userId: req.userId, category, period: period || 'monthly' },
    });

    let budget;
    if (existing) {
      budget = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount: parseFloat(amount), alertThreshold: alertThreshold || 80, isActive: true },
      });
    } else {
      budget = await prisma.budget.create({
        data: {
          userId: req.userId,
          category,
          amount: parseFloat(amount),
          period: period || 'monthly',
          month: month ? parseInt(month) : null,
          year:  year  ? parseInt(year)  : null,
          alertThreshold: alertThreshold || 80,
        },
      });
    }

    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/budgets/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Budget not found' });

    const budget = await prisma.budget.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.amount         !== undefined && { amount: parseFloat(req.body.amount) }),
        ...(req.body.alertThreshold !== undefined && { alertThreshold: req.body.alertThreshold }),
        ...(req.body.isActive       !== undefined && { isActive: req.body.isActive }),
      },
    });

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/budgets/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Budget not found' });

    await prisma.budget.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
