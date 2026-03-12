// Import Express for auth route definitions.
const express = require('express');
// Import JWT library for token creation.
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// Import User model for registration/login queries.
const User = require('../models/User.js');
const Branch = require('../models/Branch.js');
// Import auth middleware for protected profile endpoint.
const { protect } = require('../middleware/auth.js');
const path = require('path')

// Create router dedicated to authentication endpoints.
const router = express.Router();

async function normalizeBranchValue(branchValue) {
  if (!branchValue) {
    return branchValue;
  }

  if (branchValue === 'Maganjo' || branchValue === 'Matugga') {
    return branchValue;
  }

  if (typeof branchValue === 'string' && /^[a-f0-9]{24}$/i.test(branchValue)) {
    const branch = await Branch.findById(branchValue).select('name');
    return branch ? branch.name : branchValue;
  }

  if (typeof branchValue === 'object' && branchValue.name) {
    return branchValue.name;
  }

  return branchValue;
}

// Register a new user account.
router.post('/register', async (req, res) => {
  try {
    // Read registration input fields.
    let { username, password, fullName, email, role, branch } = req.body;

    // Validate mandatory fields.
    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    }

    // Standardize username to lowercase and strip spaces to prevent case-sensitivity
    // and formatting issues. Director was seeded with a space in the value which caused
    // login failures, so we consistently remove whitespace from all usernames.
    username = username.toLowerCase().trim().replace(/\s+/g, '');

    // Ensure username uniqueness.
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Ensure email uniqueness if email is provided.
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user document.
    const user = new User({
      username,
      password: hashedPassword,
      fullName,
      email,
      role,
      branch,
    });

    // Save user document.
    await user.save();

    // Return safe user profile fields (excluding password).
    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (error) {
    // Return server error for unexpected failures.
    return res.status(500).json({ error: error.message });
  }
});



router.get('/login',(req,res)=>{

  res.sendFile(path.join(__dirname, "../../public/login.html"));
})




// Authenticate user and issue JWT token.
router.post('/login', async (req, res) => {
  try {
    // Read login credentials.
    let { username, password } = req.body;

    // Validate required credentials.
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Standardize username to lowercase and remove any internal whitespace
    // so that "Mr Orban" and "mrorban" are treated the same.  This mirrors
    // registration normalization.
    username = username.toLowerCase().trim().replace(/\s+/g, '');

    // Load user by username.  The seed script and registration process
    // create accounts using a dotted scheme (e.g. "manager.maganjo").  In
    // practice it was easy for branch managers to forget the prefix, just
    // typing the branch name which resulted in a 401 during login.  To make
    // the interface more forgiving we perform a couple of additional lookups
    // when the first query fails.
    //
    // First try the literal username (all stored names are lowercased and
    // stripped of whitespace).  If that doesn't return anything and the
    // supplied value does not contain a dot we attempt to resolve it as either
    // a manager or an agent by prefixing the string accordingly.  We also
    // support a special case where users type "director" (or supply the
    // director's name without spaces) -- this will return the single user with
    // the Director role.
    let user = await User.findOne({ username });
    if (!user) {
      // allow login by typing "director" or the director's name without
      // spaces (e.g. "mrorban"), since the stored username has no spaces after
      // normalization.
      if (username === 'director') {
        user = await User.findOne({ role: 'Director' });
      }
    }

    if (!user && !username.includes('.')) {
      // try manager branch
      user = await User.findOne({ username: `manager.${username}` });
      // if still not found, fall back to sales agent; branch names are unique
      if (!user) {
        user = await User.findOne({ username: `agent.${username}` });
      }
    }

    // Reject unknown users.
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Support bcrypt hashed passwords and legacy plain-text records.
    let isMatch = false;
    if (typeof user.password === 'string' && user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const normalizedBranch = await normalizeBranchValue(user.branch);

    // Sign JWT containing user id, role, and branch.
    const token = jwt.sign(
      { id: user._id, role: user.role, branch: normalizedBranch },
      process.env.JWT_SECRET || '+4g+PzIOxBHN1vnNuhNM4E67oY5P9d7ljXuwPjnM0kE=',
      { expiresIn: '24h' }
    );

    // Return token and safe user profile fields.
    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        branch: normalizedBranch,
      },
    });
  } catch (error) {
    // Return server error for unexpected failures.
    return res.status(500).json({ error: error.message });
  }
});

// Return the currently authenticated user's profile.
router.get('/me', protect, async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      branch: await normalizeBranchValue(req.user.branch),
    },
  });
});

// Temporary route for debugging user login issues.
router.get('/debug-users', async (req, res) => {
  try {
    // Fetch all users and select only their usernames for security.
    const users = await User.find({}).select('username role branch').lean();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users for debugging.', details: error.message });
  }
});

// Export auth router.
module.exports = router;
