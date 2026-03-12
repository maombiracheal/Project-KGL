const express = require('express');
const router = express.Router();

// debug: indicate module has been loaded (helps verify that server is using this file)
//console.log('procurement router loaded');
const Procurement = require('../models/Procurement');
const Produce = require('../models/Produce');
const { protect, authorize } = require('../middleware/auth');


// POST: Record new produce 
// Only the manager is responsible for recording procurement 
router.post('/procurement', protect, authorize('Manager'), async (req, res) => {
  try {
    const {
      produceName,
      produceType,
      tonnageKg,
      costUGX,
      dealerName,
      dealerContact,
      branchName,
      sellingPricePerKg,
      procurementDate,
    } = req.body;

    const resolvedBranch = req.user.branch || branchName;
    const newEntry = new Procurement({
      produceName,
      produceType,
      tonnageKg,
      costUGX,
      dealerName,
      dealerContact,
      branchName: resolvedBranch,
      sellingPricePerKg,
      procurementDate,
      recordedBy: req.user.id // Assuming user ID comes from your auth middleware
    });

    const savedProcurement = await newEntry.save();

    const existingStock = await Produce.findOne({
      name: produceName,
      branch: resolvedBranch,
    });

    if (existingStock) {
      const currentQty = Number(existingStock.quantityKg > 0 ? existingStock.quantityKg : existingStock.quantity || 0);
      existingStock.quantity = currentQty + Number(tonnageKg);
      existingStock.quantityKg = currentQty + Number(tonnageKg);
      existingStock.pricePerKg = Number(sellingPricePerKg);
      existingStock.lastUpdated = Date.now();
      await existingStock.save();
    } else {
      await Produce.create({
        name: produceName,
        branch: resolvedBranch,
        quantity: Number(tonnageKg),
        quantityKg: Number(tonnageKg),
        pricePerKg: Number(sellingPricePerKg),
        lastUpdated: Date.now(),
      });
    }

    res.status(201).json({
      message: "Procurement recorded successfully",
      data: savedProcurement
    });
  } catch (error) {
    res.status(400).json({ 
      error: "Failed to record procurement", 
      details: error.message 
    });
  }
});
// Managers and Directors can review procurement records.
// `GET /procurement` and `GET /procurement/all` behave identically; the
// frontend dashboard prefers `/all` for consistency with other resources.
async function handleList(req, res) {
  try {
    const filter = {};
    // Directors can see all procurement records, Managers only see their branch's.
    if (req.user.role === 'Manager') {
      filter.branchName = req.user.branch;
    }
    const records = await Procurement.find(filter).sort({ procurementDate: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
}

router.get('/procurement', protect, authorize('Manager', 'Director'), handleList);
router.get('/all', protect, authorize('Manager', 'Director'), handleList);

module.exports = router;
