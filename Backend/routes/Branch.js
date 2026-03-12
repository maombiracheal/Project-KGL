const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');

// GET: Fetch all branches (Used for dropdowns in forms) 
router.get('/all', async (req, res) => {
  try {
    const branches = await Branch.find().populate('manager', 'fullName');
    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create a new branch (Director only) 
router.post('/add', async (req, res) => {
  try {
    const newBranch = new Branch(req.body);
    await newBranch.save();
    res.status(201).json({ message: "Branch added successfully", data: newBranch });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET: Get specific branch details
router.get('/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id).populate('manager');
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.status(200).json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;