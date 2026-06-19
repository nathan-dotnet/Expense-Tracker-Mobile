import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync
  ? SQLite.openDatabaseSync("expense-tracker.db")
  : SQLite.openDatabase("expense-tracker.db");

const localUserId = "local-user";

const executeLegacy = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(sql, params, (_, result) => resolve(result), (_, error) => {
        reject(error);
        return false;
      });
    });
  });

const exec = async (sql) => {
  if (db.execAsync) return db.execAsync(sql);
  return executeLegacy(sql);
};

const run = async (sql, params = []) => {
  if (db.runAsync) return db.runAsync(sql, params);
  return executeLegacy(sql, params);
};

const all = async (sql, params = []) => {
  if (db.getAllAsync) return db.getAllAsync(sql, params);
  const result = await executeLegacy(sql, params);
  return result.rows._array;
};

const first = async (sql, params = []) => {
  if (db.getFirstAsync) return db.getFirstAsync(sql, params);
  const rows = await all(sql, params);
  return rows[0] || null;
};

const nowIso = () => new Date().toISOString();
const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toExpense = (row) => ({
  ...row,
  amount: parseFloat(row.amount),
  isRecurring: !!row.isRecurring,
});

const toBudget = (row, spent = 0) => {
  const amount = parseFloat(row.amount);
  const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;
  return {
    ...row,
    amount,
    spent,
    percentage,
    isOverBudget: spent > amount,
    isNearLimit: percentage >= parseInt(row.alertThreshold || 80, 10),
  };
};

const getMonthRange = ({ year, month } = {}) => {
  const today = new Date();
  const targetYear = parseInt(year, 10) || today.getFullYear();
  const targetMonth = parseInt(month, 10) || today.getMonth() + 1;
  const start = new Date(targetYear, targetMonth - 1, 1);
  const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString(), targetYear, targetMonth };
};

export const initDatabase = async () => {
  await exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      currency TEXT NOT NULL DEFAULT 'PHP',
      notificationsEnabled INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      tags TEXT,
      isRecurring INTEGER NOT NULL DEFAULT 0,
      recurringInterval TEXT,
      paymentMethod TEXT NOT NULL DEFAULT 'other',
      receiptUrl TEXT,
      receiptFilename TEXT,
      receiptOcrText TEXT,
      receiptProcessedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      month INTEGER,
      year INTEGER,
      alertThreshold INTEGER NOT NULL DEFAULT 80,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);

  const existing = await first("SELECT * FROM profile WHERE id = ?", [localUserId]);
  if (!existing) {
    const now = nowIso();
    await run(
      "INSERT INTO profile (id, name, email, currency, notificationsEnabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [localUserId, "You", "local@device", "PHP", 1, now, now],
    );
  }
};

export const getProfile = async () => {
  await initDatabase();
  const profile = await first("SELECT * FROM profile WHERE id = ?", [localUserId]);
  return {
    ...profile,
    notificationsEnabled: !!profile.notificationsEnabled,
  };
};

export const updateProfile = async (data) => {
  await initDatabase();
  const current = await getProfile();
  const next = {
    ...current,
    ...data,
    notificationsEnabled:
      data.notificationsEnabled === undefined
        ? current.notificationsEnabled
        : !!data.notificationsEnabled,
    updatedAt: nowIso(),
  };
  await run(
    "UPDATE profile SET name = ?, email = ?, currency = ?, notificationsEnabled = ?, updatedAt = ? WHERE id = ?",
    [
      next.name,
      next.email,
      next.currency,
      next.notificationsEnabled ? 1 : 0,
      next.updatedAt,
      localUserId,
    ],
  );
  return getProfile();
};

export const getExpenses = async ({ page = 1, limit = 20, search, category } = {}) => {
  await initDatabase();
  const where = [];
  const params = [];
  if (search) {
    where.push("(title LIKE ? OR notes LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    where.push("category = ?");
    params.push(category);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const totalRow = await first(`SELECT COUNT(*) as total FROM expenses ${whereSql}`, params);
  const total = totalRow?.total || 0;
  const offset = (page - 1) * limit;
  const rows = await all(
    `SELECT * FROM expenses ${whereSql} ORDER BY date DESC, createdAt DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return {
    data: rows.map(toExpense),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getExpenseById = async (id) => {
  await initDatabase();
  const row = await first("SELECT * FROM expenses WHERE id = ?", [id]);
  return row ? toExpense(row) : null;
};

export const createExpense = async (data) => {
  await initDatabase();
  const profile = await getProfile();
  const now = nowIso();
  const id = makeId();
  const expense = {
    id,
    title: data.title,
    amount: parseFloat(data.amount),
    currency: data.currency || profile.currency,
    category: data.category,
    date: data.date || now,
    notes: data.notes || null,
    tags: data.tags || null,
    isRecurring: data.isRecurring ? 1 : 0,
    recurringInterval: data.recurringInterval || null,
    paymentMethod: data.paymentMethod || "other",
    receiptUrl: data.receiptUrl || null,
    receiptFilename: data.receiptFilename || null,
    receiptOcrText: data.receiptOcrText || null,
    receiptProcessedAt: data.receiptProcessedAt || null,
    createdAt: now,
    updatedAt: now,
  };
  await run(
    `INSERT INTO expenses
      (id, title, amount, currency, category, date, notes, tags, isRecurring, recurringInterval, paymentMethod, receiptUrl, receiptFilename, receiptOcrText, receiptProcessedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      expense.id,
      expense.title,
      expense.amount,
      expense.currency,
      expense.category,
      expense.date,
      expense.notes,
      expense.tags,
      expense.isRecurring,
      expense.recurringInterval,
      expense.paymentMethod,
      expense.receiptUrl,
      expense.receiptFilename,
      expense.receiptOcrText,
      expense.receiptProcessedAt,
      expense.createdAt,
      expense.updatedAt,
    ],
  );
  return getExpenseById(id);
};

export const updateExpense = async (id, data) => {
  await initDatabase();
  const existing = await getExpenseById(id);
  if (!existing) throw new Error("Expense not found");
  const next = { ...existing, ...data, amount: parseFloat(data.amount ?? existing.amount), updatedAt: nowIso() };
  await run(
    `UPDATE expenses
     SET title = ?, amount = ?, currency = ?, category = ?, date = ?, notes = ?, tags = ?, isRecurring = ?,
         recurringInterval = ?, paymentMethod = ?, receiptUrl = ?, receiptFilename = ?, receiptOcrText = ?,
         receiptProcessedAt = ?, updatedAt = ?
     WHERE id = ?`,
    [
      next.title,
      next.amount,
      next.currency,
      next.category,
      next.date,
      next.notes || null,
      next.tags || null,
      next.isRecurring ? 1 : 0,
      next.recurringInterval || null,
      next.paymentMethod || "other",
      next.receiptUrl || null,
      next.receiptFilename || null,
      next.receiptOcrText || null,
      next.receiptProcessedAt || null,
      next.updatedAt,
      id,
    ],
  );
  return getExpenseById(id);
};

export const deleteExpense = async (id) => {
  await initDatabase();
  await run("DELETE FROM expenses WHERE id = ?", [id]);
  return id;
};

export const getSummary = async (params = {}) => {
  await initDatabase();
  const { start, end } = getMonthRange(params);
  const rows = await all(
    "SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date DESC",
    [start, end],
  );
  const total = rows.reduce((sum, row) => sum + parseFloat(row.amount), 0);
  const categoryMap = rows.reduce((acc, row) => {
    if (!acc[row.category]) acc[row.category] = { category: row.category, total: 0, count: 0 };
    acc[row.category].total += parseFloat(row.amount);
    acc[row.category].count += 1;
    return acc;
  }, {});
  return {
    total,
    count: rows.length,
    categoryBreakdown: Object.values(categoryMap).sort((a, b) => b.total - a.total),
  };
};

export const getBudgets = async () => {
  await initDatabase();
  const budgets = await all("SELECT * FROM budgets WHERE isActive = 1 ORDER BY category = 'Total' DESC, category ASC");
  const { start, end } = getMonthRange();
  const spending = await all(
    "SELECT category, SUM(amount) as spent FROM expenses WHERE date >= ? AND date <= ? GROUP BY category",
    [start, end],
  );
  const spendingMap = spending.reduce((acc, row) => {
    acc[row.category] = parseFloat(row.spent || 0);
    return acc;
  }, {});
  const totalSpent = Object.values(spendingMap).reduce((sum, amount) => sum + amount, 0);
  return budgets.map((budget) =>
    toBudget(budget, budget.category === "Total" ? totalSpent : spendingMap[budget.category] || 0),
  );
};

export const saveBudget = async ({ category, amount }) => {
  await initDatabase();
  const existing = await first("SELECT * FROM budgets WHERE category = ?", [category]);
  const now = nowIso();
  if (existing) {
    await run("UPDATE budgets SET amount = ?, updatedAt = ? WHERE category = ?", [
      parseFloat(amount),
      now,
      category,
    ]);
  } else {
    await run(
      "INSERT INTO budgets (id, category, amount, period, alertThreshold, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [makeId(), category, parseFloat(amount), "monthly", 80, 1, now, now],
    );
  }
  const budgets = await getBudgets();
  return budgets.find((budget) => budget.category === category);
};

export const deleteBudget = async (id) => {
  await initDatabase();
  await run("DELETE FROM budgets WHERE id = ?", [id]);
  return id;
};

export const getMonthlyReport = async ({ months = 6 } = {}) => {
  await initDatabase();
  const result = [];
  const today = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const ref = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = ref.getFullYear();
    const month = ref.getMonth() + 1;
    const { start, end } = getMonthRange({ year, month });
    const rows = await all("SELECT * FROM expenses WHERE date >= ? AND date <= ?", [start, end]);
    const byCategory = rows.reduce((acc, row) => {
      acc[row.category] = (acc[row.category] || 0) + parseFloat(row.amount);
      return acc;
    }, {});
    result.push({
      year,
      month,
      label: ref.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
      total: rows.reduce((sum, row) => sum + parseFloat(row.amount), 0),
      count: rows.length,
      byCategory,
    });
  }
  return result;
};

export const getYearlyReport = async ({ year = new Date().getFullYear() } = {}) => {
  await initDatabase();
  const start = new Date(year, 0, 1).toISOString();
  const end = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();
  const rows = await all("SELECT * FROM expenses WHERE date >= ? AND date <= ?", [start, end]);
  const byMonth = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    label: new Date(year, index, 1).toLocaleDateString(undefined, { month: "short" }),
    total: 0,
    count: 0,
  }));
  const byCategoryMap = {};
  rows.forEach((row) => {
    const date = new Date(row.date);
    const monthIndex = date.getMonth();
    byMonth[monthIndex].total += parseFloat(row.amount);
    byMonth[monthIndex].count += 1;
    byCategoryMap[row.category] = (byCategoryMap[row.category] || 0) + parseFloat(row.amount);
  });
  return {
    year,
    total: rows.reduce((sum, row) => sum + parseFloat(row.amount), 0),
    count: rows.length,
    byMonth,
    byCategory: Object.entries(byCategoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
};

export const getLocalInsight = async () => {
  const summary = await getSummary();
  if (!summary.count) return null;
  const top = summary.categoryBreakdown[0];
  const tips = [
    "Set a monthly budget for your top spending category.",
    "Review recurring purchases before the next billing cycle.",
    "Log expenses as soon as possible to keep reports accurate.",
    "Compare category totals weekly so surprises stay small.",
    "Keep receipts attached to important purchases for easier review.",
  ];
  return {
    id: "local-insight",
    summary: `You spent ${summary.total.toFixed(2)} this month across ${summary.count} transactions. Your highest category is ${top.category}.`,
    content: `This offline insight is generated on your device from local expense data. ${top.category} is currently your largest spending area at ${top.total.toFixed(2)} across ${top.count} transactions.\n\nBecause the app is in 100% offline mode, no financial data is sent to an AI service or backend server.`,
    tips,
  };
};
