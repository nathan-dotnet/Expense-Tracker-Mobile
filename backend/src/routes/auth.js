const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma   = require('../prisma/client');
const auth     = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'change-me-in-production', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

// ── POST /api/auth/register ───────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { name, email, password, currency = 'USD' } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, currency },
        select: { id: true, name: true, email: true, currency: true, createdAt: true },
      });

      res.status(201).json({ success: true, token: generateToken(user.id), user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

      const { password: _pw, ...safeUser } = user;
      res.json({ success: true, token: generateToken(user.id), user: safeUser });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', auth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ── PATCH /api/auth/profile ───────────────────────────────
router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, currency, notificationsEnabled } = req.body;
    const data = {};
    if (name  !== undefined) data.name  = name;
    if (currency !== undefined) data.currency = currency;
    if (notificationsEnabled !== undefined) data.notificationsEnabled = notificationsEnabled;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, name: true, email: true, currency: true, notificationsEnabled: true },
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/auth/change-password ───────────────────────
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: await bcrypt.hash(newPassword, 12) },
    });
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
