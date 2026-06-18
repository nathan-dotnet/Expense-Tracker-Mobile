const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const Tesseract = require("tesseract.js");
const prisma = require("../prisma/client");
const auth = require("../middleware/auth");

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads/receipts");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ok =
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    ok
      ? cb(null, true)
      : cb(new Error("Only image files and PDFs are allowed"));
  },
});

// POST /api/receipts/upload — upload & OCR
router.post("/upload", auth, upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    // Build full URL for the receipt so mobile app can access it
    const protocol = req.protocol || "http";
    const host = req.get("host");
    const fileUrl = `${protocol}://${host}/uploads/receipts/${req.file.filename}`;

    // Run OCR
    let ocrText = "";
    try {
      const result = await Tesseract.recognize(req.file.path, "eng", {
        logger: () => {},
      });
      ocrText = result.data.text;
    } catch (ocrErr) {
      console.warn("OCR failed:", ocrErr.message);
    }

    // Attempt to extract amount from OCR text
    const amountMatch = ocrText.match(
      /(?:total|amount|subtotal|grand total)[:\s]*\$?([\d,]+\.?\d{0,2})/i,
    );
    const suggestedAmount = amountMatch
      ? parseFloat(amountMatch[1].replace(",", ""))
      : null;

    // If expenseId passed, attach receipt to existing expense
    if (req.body.expenseId) {
      const expense = await prisma.expense.findFirst({
        where: { id: req.body.expenseId, userId: req.userId },
      });
      if (expense) {
        await prisma.expense.update({
          where: { id: req.body.expenseId },
          data: {
            receiptFilename: req.file.filename,
            receiptUrl: fileUrl,
            receiptOcrText: ocrText,
            receiptProcessedAt: new Date(),
          },
        });
      }
    }

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        ocrText,
        suggestedAmount,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/receipts/:filename
router.delete("/:filename", auth, async (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../../uploads/receipts",
      req.params.filename,
    );
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Detach from any expense
    await prisma.expense.updateMany({
      where: { userId: req.userId, receiptFilename: req.params.filename },
      data: {
        receiptFilename: null,
        receiptUrl: null,
        receiptOcrText: null,
        receiptProcessedAt: null,
      },
    });

    res.json({ success: true, message: "Receipt deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
