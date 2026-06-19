const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CURRENCY_SYMBOLS = {
  USD: "$",
  PHP: "\u20b1",
  EUR: "\u20ac",
  GBP: "\u00a3",
  JPY: "\u00a5",
  INR: "\u20b9",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  HKD: "HK$",
  MXN: "$",
  BRL: "R$",
};

const getCurrencySymbol = (code = "USD") => CURRENCY_SYMBOLS[code] || code;

// GET /api/insights — fetch or generate for month
router.get("/", auth, async (req, res) => {
  try {
    const { year, month, refresh = "false" } = req.query;
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const currencySymbol = getCurrencySymbol(req.user?.currency);

    // Return cached insight unless refresh requested
    if (refresh !== "true") {
      const cached = await prisma.insight.findFirst({
        where: { userId: req.userId, year: targetYear, month: targetMonth },
        orderBy: { createdAt: "desc" },
      });
      if (cached)
        return res.json({ success: true, data: cached, cached: true });
    }

    // Gather spending data
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId, date: { gte: startDate, lte: endDate } },
      select: {
        amount: true,
        category: true,
        date: true,
        title: true,
        paymentMethod: true,
      },
    });

    if (expenses.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: "No expenses found for this period",
      });
    }

    // Build summary for AI
    const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.category] =
        (byCategory[e.category] || 0) + parseFloat(e.amount);
    });
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

    // Previous month for comparison
    const prevStart = new Date(targetYear, targetMonth - 2, 1);
    const prevEnd = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59);
    const prevExpenses = await prisma.expense.findMany({
      where: { userId: req.userId, date: { gte: prevStart, lte: prevEnd } },
      select: { amount: true, category: true },
    });
    const prevTotal = prevExpenses.reduce(
      (s, e) => s + parseFloat(e.amount),
      0,
    );

    const prompt = `You are a personal finance advisor analyzing spending data.

Month: ${targetYear}-${String(targetMonth).padStart(2, "0")}
Total Spent: ${currencySymbol}${total.toFixed(2)}
Previous Month Total: ${currencySymbol}${prevTotal.toFixed(2)} (${prevTotal > 0 ? (((total - prevTotal) / prevTotal) * 100).toFixed(1) : "N/A"}% change)
Number of Transactions: ${expenses.length}

Category Breakdown:
${sorted.map(([cat, amt]) => `- ${cat}: ${currencySymbol}${amt.toFixed(2)} (${((amt / total) * 100).toFixed(1)}%)`).join("\n")}

Provide a JSON response with exactly this structure (no markdown, pure JSON):
{
  "summary": "2-3 sentence executive summary of this month's spending",
  "content": "3-4 paragraph detailed analysis covering: top spending categories, trends vs last month, patterns noticed, and financial health assessment",
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
}`;

    let parsed;
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = message.content[0].text.trim();
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
    } catch (aiError) {
      // If AI fails (auth error, etc), return a default insight
      console.warn(
        "AI insight generation failed, using placeholder:",
        aiError.message,
      );
      const categoryNames = sorted.map(([cat]) => cat).join(", ");
      const topCategory = sorted[0]?.[0] || "General";
      parsed = {
        summary: `You spent ${currencySymbol}${total.toFixed(2)} this month. Top spending categories: ${topCategory}. (AI insights unavailable - check API key in .env)`,
        content: `Your spending this month totaled ${currencySymbol}${total.toFixed(2)} across ${expenses.length} transactions. Key categories: ${categoryNames}. Compare this with previous months to identify trends and set better budgets.`,
        tips: [
          "Set category-based budgets to control spending",
          "Review subscriptions and recurring charges",
          "Track daily expenses to stay accountable",
          "Identify peak spending days and adjust habits",
          "Build an emergency fund alongside budgeting",
        ],
      };
    }

    // Save to DB
    const insight = await prisma.insight.create({
      data: {
        userId: req.userId,
        year: targetYear,
        month: targetMonth,
        summary: parsed.summary,
        content: parsed.content,
        tips: JSON.stringify(parsed.tips),
      },
    });

    res.json({
      success: true,
      data: { ...insight, tips: parsed.tips },
      cached: false,
    });
  } catch (error) {
    console.error("Insight generation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
