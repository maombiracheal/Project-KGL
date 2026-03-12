const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Branch = require('../models/Branch');

const BRANCH_NAMES = new Set(['Maganjo', 'Matugga']);

const normalizeBranchValue = async (branchValue) => {
  if (!branchValue) {
    return branchValue;
  }

  if (typeof branchValue === 'string' && BRANCH_NAMES.has(branchValue)) {
    return branchValue;
  }

  if (typeof branchValue === 'string' && /^[a-f0-9]{24}$/i.test(branchValue)) {
    const branch = await Branch.findById(branchValue).select('name');
    return branch ? branch.name : branchValue;
  }

  if (typeof branchValue === 'object' && branchValue.name && BRANCH_NAMES.has(branchValue.name)) {
    return branchValue.name;
  }

  return branchValue;
};

// 1. Protect: Verifies if the user is logged in
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '+4g+PzIOxBHN1vnNuhNM4E67oY5P9d7ljXuwPjnM0kE=');

      // Get user from the token and attach to request
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user no longer exists' });
      }
      req.user.branch = await normalizeBranchValue(req.user.branch);
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
};

// 2. Authorize: Checks if the user has the right Role (Manager/Agent/Director)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

const authorizeDirectorIdentity = (
  allowedNames = ['mr. orban', 'mr orban'],
  allowedUsernames = ['orban', 'mr orban']
) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const fullName = (req.user.fullName || '').trim().toLowerCase();
    const username = (req.user.username || '').trim().toLowerCase();
    const isAllowedDirector =
      allowedNames.includes(fullName) || allowedUsernames.includes(username);

    if (!isAllowedDirector) {
      return res.status(403).json({
        message: 'Only Mr. Orban can access this route',
      });
    }

    next();
  };
};

module.exports = { protect, authorize, authorizeDirectorIdentity };
