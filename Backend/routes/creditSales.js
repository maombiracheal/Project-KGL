const express = require('express');
const router = express.Router();
const CreditSale = require('../models/CreditSale');
const Produce = require('../models/Produce');
const { protect, authorize } = require('../middleware/auth');

// GET: Credit sales for the logged-in branch
router.get('/records', protect, authorize('Manager', 'Sales Agent', 'Director'), async (req, res) => {
  try {
    const branchFilter = req.user.role === 'Director' ? {} : { branch: req.user.branch };
    const query = CreditSale.find(branchFilter).sort({ dispatchDate: -1, createdAt: -1 });
    const records = req.user.role === 'Director' ? await query : await query.limit(20);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Record a Credit Sale
router.post('/add-credit', protect, authorize('Manager', 'Sales Agent'), async (req, res) => {
  try {
    const { produceName, tonnageKg, buyerName, nationalIdNIN, location, contact, dueDate } = req.body;
    const branch = req.user.branch;
    const requestedQty = Number(tonnageKg);

    // 1. Business Rule: Check if product is in stock
    const stock = await Produce.findOne({ name: produceName, branch: branch });

    if (!produceName || !buyerName || !nationalIdNIN || !location || !contact || !dueDate || requestedQty <= 0) {
      return res.status(400).json({
        message: 'produceName, tonnageKg, buyerName, nationalIdNIN, location, contact, and dueDate are required'
      });
    }

    const currentQty = Number(stock && (stock.quantityKg > 0 ? stock.quantityKg : stock.quantity || 0));

    if (!stock || currentQty < requestedQty) {
      return res.status(400).json({ 
        message: "Stock unavailable or insufficient for this credit request" 
      });
    }

    if (!stock.pricePerKg || Number(stock.pricePerKg) <= 0) {
      return res.status(400).json({
        message: 'Selling price is not set. Manager must pre-populate price first.',
      });
    }

    const amountDueUGX = requestedQty * Number(stock.pricePerKg);

    // 2. Create the Credit Sale record with required fields
    const newCreditSale = new CreditSale({
      buyerName,
      nationalIdNIN,
      location,
      contact,
      amountDueUGX,
      amountPaidUGX: 0,
      salesAgentName: req.user.fullName || req.user.username,
      dueDate,
      produceName: produceName,
      tonnageKg: requestedQty,
      dispatchDate: req.body.dispatchDate || Date.now(),
      branch
    });

    await newCreditSale.save();

    // 3. Business Rule: Reduce stock tonnage upon dispatch
    stock.quantity = currentQty - requestedQty;
    stock.quantityKg = currentQty - requestedQty;
    stock.lastUpdated = Date.now();
    await stock.save();

    res.status(201).json({ 
      message: "Credit sale recorded successfully and stock updated", 
      data: newCreditSale 
    });

  } catch (error) {
    res.status(400).json({ 
      error: "Failed to record credit sale", 
      details: error.message 
    });
  }
});

module.exports = router;
