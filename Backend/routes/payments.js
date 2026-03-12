const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const CreditSale = require('../models/CreditSale');
const { protect, authorize } = require('../middleware/auth');

router.get('/history', protect, authorize('Manager', 'Sales Agent', 'Director'), async (req, res) => {
  try {
    const branchFilter = req.user.role === 'Director' ? {} : { branch: req.user.branch };
    const query = Payment.find(branchFilter).sort({ paymentDate: -1, createdAt: -1 });
    const payments = req.user.role === 'Director' ? await query : await query.limit(20);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/record', protect, authorize('Manager', 'Sales Agent'), async (req, res) => {
  try {
    const { buyerName, amountPaidUGX, method, reference } = req.body;
    const paidAmount = Number(amountPaidUGX);
    const branch = req.user.branch;

    if (!buyerName || paidAmount <= 0 || !method || !reference) {
      return res.status(400).json({
        message: 'buyerName, amountPaidUGX, method, and reference are required',
      });
    }

    const payment = await Payment.create({
      buyerName,
      amountPaidUGX: paidAmount,
      method,
      reference,
      branch,
      recordedBy: req.user.fullName || req.user.username,
      paymentDate: new Date(),
    });

    let remaining = paidAmount;
    const openCredits = await CreditSale.find({
      branch,
      buyerName,
      $expr: { $lt: ['$amountPaidUGX', '$amountDueUGX'] },
    }).sort({ dueDate: 1, createdAt: 1 });

    for (const credit of openCredits) {
      if (remaining <= 0) {
        break;
      }
      const outstanding = Number(credit.amountDueUGX || 0) - Number(credit.amountPaidUGX || 0);
      const allocation = Math.min(outstanding, remaining);
      credit.amountPaidUGX = Number(credit.amountPaidUGX || 0) + allocation;
      remaining -= allocation;
      await credit.save();
    }

    res.status(201).json({
      message: 'Payment recorded successfully',
      data: payment,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
