const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validate, userSchemas } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');


// ================= REGISTER =================
const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  // Check existing email
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      error: 'Registration failed',
      message: 'User with this email already exists'
    });
  }

  // Check existing username
  const existingUsername = await User.findByUsername(username);
  if (existingUsername) {
    return res.status(409).json({
      error: 'Registration failed',
      message: 'Username already taken'
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    role: role || 'analyst'
  });

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // ✅ IMPORTANT: pass FULL user (NOT profile)
  const token = generateToken(user);

  res.status(201).json({
    message: 'User registered successfully',
    user: user.profile,
    token
  });
});


// ================= LOGIN =================
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(401).json({
      error: 'Login failed',
      message: 'Invalid email or password'
    });
  }

  if (user.status !== 'active') {
    return res.status(401).json({
      error: 'Login failed',
      message: 'Account is inactive'
    });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Login failed',
      message: 'Invalid email or password'
    });
  }

  // Update login time
  user.lastLogin = new Date();
  await user.save();

  // ✅ IMPORTANT FIX
  const token = generateToken(user);

  res.json({
    message: 'Login successful',
    user: user.profile,
    token
  });
});


// ================= GET PROFILE =================
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User profile not found'
    });
  }

  res.json({
    message: 'Profile retrieved successfully',
    user: user.profile
  });
});


// ================= CHANGE PASSWORD =================
const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  const isValidPassword = await user.comparePassword(current_password);

  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Password change failed',
      message: 'Current password is incorrect'
    });
  }

  user.password = new_password;
  await user.save();

  res.json({
    message: 'Password changed successfully'
  });
});


// ================= REFRESH TOKEN =================
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  // ✅ IMPORTANT FIX
  const token = generateToken(user);

  res.json({
    message: 'Token refreshed successfully',
    token
  });
});


// ================= EXPORT =================
module.exports = {
  register: [validate(userSchemas.create), register],
  login: [validate(userSchemas.login), login],
  getProfile,
  changePassword: [validate(userSchemas.changePassword), changePassword],
  refreshToken
};