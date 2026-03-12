const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Produce = require('../models/Produce');
const { protect, authorize } = require('../middleware/auth');

// GET: Recent sales for the logged-in branch
router.get('/recent', protect, authorize('Manager', 'Sales Agent', 'Director'), async (req, res) => {
  try {
    const branchFilter = req.user.role === 'Director' ? {} : { branch: req.user.branch };
    const query = Sale.find(branchFilter).sort({ dateTime: -1 });
    const sales = req.user.role === 'Director' ? await query : await query.limit(20);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Record a cash sale
router.post('/cash', protect, authorize('Manager', 'Sales Agent'), async (req, res) => {
  try {
    const { produceName, tonnageKg, buyerName } = req.body;
    const branch = req.user.branch;

    if (!produceName || !tonnageKg || !buyerName) {
      return res.status(400).json({
        message: 'produceName, tonnageKg, and buyerName are required',
      });
    }

    if (Number(tonnageKg) <= 0) {
      return res.status(400).json({
        message: 'tonnageKg must be greater than 0',
      });
    }

    const stock = await Produce.findOne({ name: produceName, branch });
    if (!stock) {
      return res.status(404).json({
        message: 'Produce not found in your branch stock',
      });
    }

    const currentQty = Number(
      stock.quantityKg > 0 ? stock.quantityKg : stock.quantity || 0
    );

    if (currentQty <= 0) {
      return res.status(400).json({
        message: 'Produce is out of stock. Manager notification required.',
        managerNotification: {
          level: 'critical',
          type: 'OUT_OF_STOCK',
          produceName,
          branch,
        },
      });
    }

    if (currentQty < Number(tonnageKg)) {
      return res.status(400).json({
        message: 'Insufficient stock for requested tonnage',
      });
    }

    if (!stock.pricePerKg || Number(stock.pricePerKg) <= 0) {
      return res.status(400).json({
        message: 'Selling price is not set. Manager must pre-populate price first.',
      });
    }

    const amountPaidUGX = Number(tonnageKg) * Number(stock.pricePerKg);

    const newSale = new Sale({
      produceName,
      tonnageKg: Number(tonnageKg),
      amountPaidUGX,
      buyerName,
      salesAgentName: req.user.fullName || req.user.username,
      branch,
    });
    await newSale.save();

    const updatedQty = currentQty - Number(tonnageKg);
    stock.quantity = updatedQty;
    stock.quantityKg = updatedQty;
    stock.lastUpdated = Date.now();
    await stock.save();

    const response = {
      message: 'Sale recorded and stock updated',
      sale: newSale,
      stock: {
        produceName: stock.name,
        branch: stock.branch,
        remainingKg: updatedQty,
        pricePerKg: stock.pricePerKg,
      },
    };

    if (updatedQty === 0) {
      response.managerNotification = {
        level: 'critical',
        type: 'OUT_OF_STOCK',
        produceName: stock.name,
        branch: stock.branch,
      };
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
