const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');

router.get('/all', protect, authorize('Director'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1, fullName: 1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/create', protect, authorize('Director'), async (req, res) => {
    try {
        let { username, password, role, branch, fullName } = req.body;

        if (!username || !password || !role || !fullName) {
            return res.status(400).json({ error: 'username, password, role, and fullName are required' });
        }

        username = username.toLowerCase();

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword,
            role,
            branch,
            fullName
        });

        await newUser.save();
        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser._id,
                username: newUser.username,
                fullName: newUser.fullName,
                role: newUser.role,
                branch: newUser.branch
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id', protect, authorize('Director'), async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (String(userToDelete._id) === String(req.user._id)) {
            return res.status(400).json({ error: 'Director cannot delete the currently logged in account' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
