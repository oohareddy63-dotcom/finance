const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
// ======================
// ✅ GENERATE TOKEN (FIXED)
// ======================
const generateToken = (user) => {
  const payload = {
    id: user._id.toString(),   // ✅ FIXED (IMPORTANT)
    email: user.email,
    role: user.role,
    permissions: typeof user.getPermissions === 'function'
      ? user.getPermissions()
      : []
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

// ======================
// ✅ AUTHENTICATE (FIXED)
// ======================
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid JWT token'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ VALIDATE OBJECT ID
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(400).json({
        error: 'Invalid user ID in token'
      });
    }

    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User account is inactive'
      });
    }

    // ✅ ATTACH USER
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.getPermissions()
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

// ======================
// ✅ AUTHORIZE
// ======================
const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userPermissions = req.user.permissions || [];

    const hasPermission = requiredPermissions.every(p =>
      userPermissions.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Access denied',
        required: requiredPermissions,
        user_permissions: userPermissions
      });
    }

    next();
  };
};

// ======================
// ✅ ROLE AUTHORIZATION
// ======================
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Role not allowed'
      });
    }
    next();
  };
};

// ======================
// ✅ SELF OR ADMIN
// ======================
const authorizeSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  const targetUserId = req.params.id || req.params.user_id;

  const isSelf = req.user.id === targetUserId;
  const isAdmin = req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      error: 'Access denied'
    });
  }

  next();
};

// ======================
// ✅ OPTIONAL AUTH
// ======================
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
        return next();
      }

      const user = await User.findById(decoded.id);

      if (user && user.status === 'active') {
        req.user = {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.getPermissions()
        };
      }
    } catch (err) {
      // ignore token error
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  generateToken,
  authenticate,
  authorize,
  authorizeRole,
  authorizeSelfOrAdmin,
  optionalAuth
};
