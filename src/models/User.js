const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['viewer', 'analyst', 'admin'],
    default: 'analyst'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});


// 🔐 HASH PASSWORD BEFORE SAVE
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


// 🔑 COMPARE PASSWORD (FIXED)
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error("Password not found in DB");
  }
  return await bcrypt.compare(candidatePassword, this.password);
};


// 🔐 REMOVE PASSWORD FROM RESPONSE (SAFE WAY)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};


// 🔐 PERMISSIONS BASED ON ROLE
userSchema.methods.getPermissions = function() {
  const rolePermissions = {
    viewer: ['read:dashboard', 'read:records'],
    analyst: ['read:dashboard', 'read:records', 'read:analytics'],
    admin: [
      'read:dashboard',
      'read:records',
      'read:analytics',
      'write:records',
      'delete:records',
      'manage:users'
    ]
  };

  return rolePermissions[this.role] || [];
};


// 👤 USER PROFILE (SAFE DATA)
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    status: this.status,
    permissions: this.getPermissions(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});


// 🔎 STATIC METHODS
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function(filter = {}) {
  return this.find({ ...filter, status: 'active' });
};


module.exports = mongoose.model('User', userSchema);
