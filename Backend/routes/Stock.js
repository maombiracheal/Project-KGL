const express = require('express');
const router = express.Router();
const Produce = require('../models/Produce');
const Branch = require('../models/Branch');
const { protect, authorize } = require('../middleware/auth');

const BRANCH_NAMES = new Set(['Maganjo', 'Matugga']);

async function getBranchAliases(branchName) {
  if (!branchName) {
    return [];
  }

  if (!BRANCH_NAMES.has(branchName)) {
    return [branchName];
  }

  const branchDoc = await Branch.findOne({ name: branchName }).select('_id');
  return branchDoc ? [branchName, String(branchDoc._id)] : [branchName];
}

async function normalizeStockBranch(stock) {
  if (!stock || !stock.branch) {
    return stock;
  }

  if (BRANCH_NAMES.has(stock.branch)) {
    return stock;
  }

  if (/^[a-f0-9]{24}$/i.test(String(stock.branch))) {
    const branchDoc = await Branch.findById(stock.branch).select('name');
    if (branchDoc && branchDoc.name) {
      return {
        ...stock,
        branch: branchDoc.name,
      };
    }
  }

  return stock;
}

// GET: View all stock (Used by Sales Agents and Managers)
router.get('/all', protect, authorize('Sales Agent', 'Manager', 'Director'), async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'Director') {
      const aliases = await getBranchAliases(req.user.branch);
      filter.branch = { $in: aliases };
    }
    const stock = await Produce.find(filter).lean();
    const normalizedStock = await Promise.all(stock.map(normalizeStockBranch));
    res.json(normalizedStock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: View stock for a specific branch
router.get('/branch/:branchName', protect, authorize('Sales Agent', 'Manager', 'Director'), async (req, res) => {
  try {
    const requestedBranch = req.params.branchName;

    // Non-directors can only view their own branch's stock.
    if (req.user.role !== 'Director') {
      const userBranchAliases = await getBranchAliases(req.user.branch);
      if (!userBranchAliases.includes(requestedBranch)) {
        return res.status(403).json({ error: 'You are not authorized to view stock for this branch.' });
      }
    }
    const aliases = await getBranchAliases(requestedBranch);
    const stock = await Produce.find({ branch: { $in: aliases } }).lean();
    const normalizedStock = await Promise.all(stock.map(normalizeStockBranch));
    res.json(normalizedStock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Available stock in the logged in user's branch
router.get('/available', protect, authorize('Sales Agent', 'Manager', 'Director'), async (req, res) => {
  try {
    let stock;
    if (req.user.role === 'Director') {
      stock = await Produce.find().select('name branch quantity quantityKg pricePerKg').lean();
    } else {
      const aliases = await getBranchAliases(req.user.branch);
      stock = await Produce.find({ branch: { $in: aliases } }).select('name branch quantity quantityKg pricePerKg').lean();
    }

    const normalizedStock = await Promise.all(stock.map(normalizeStockBranch));
    const available = normalizedStock
      .map((item) => {
        const qty = Number(item.quantityKg > 0 ? item.quantityKg : item.quantity || 0);
        return {
          id: item._id,
          name: item.name,
          branch: item.branch,
          availableKg: qty,
          pricePerKg: item.pricePerKg || 0,
        };
      })
      .filter((item) => item.availableKg > 0);

    res.json(available);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Manager updates the selling price or initializes stock 
router.put('/update-price', protect, authorize('Manager'), async (req, res) => {
  try {
    const { name, pricePerKg } = req.body;
    const branch = req.user.branch;

    if (!name || !pricePerKg || Number(pricePerKg) <= 0) {
      return res.status(400).json({ error: 'name and a valid pricePerKg are required' });
    }

    const updatedStock = await Produce.findOneAndUpdate(
      { name, branch },
      {
        $set: { pricePerKg, lastUpdated: Date.now() },
        $setOnInsert: { quantity: 0, quantityKg: 0, branch, name },
      },
      { returnDocument: 'after', upsert: true }
    );
    res.json({ message: "Stock price updated", data: updatedStock });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT: Manager updates available quantity and selling price for stock
router.put('/upsert-stock', protect, authorize('Manager'), async (req, res) => {
  try {
    const { name, quantityKg, pricePerKg } = req.body;
    const branch = req.user.branch;
    const resolvedQty = Number(quantityKg);
    const resolvedPrice = Number(pricePerKg);

    if (!name || resolvedQty < 0 || resolvedPrice <= 0) {
      return res.status(400).json({
        error: 'name, quantityKg (0 or more), and a valid pricePerKg are required',
      });
    }

    const updatedStock = await Produce.findOneAndUpdate(
      { name, branch },
      {
        $set: {
          quantity: resolvedQty,
          quantityKg: resolvedQty,
          pricePerKg: resolvedPrice,
          lastUpdated: Date.now(),
        },
        $setOnInsert: { branch, name },
      },
      { returnDocument: 'after', upsert: true }
    );

    res.json({ message: 'Stock availability updated', data: updatedStock });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
