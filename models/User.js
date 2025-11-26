// ============================================
// FILE 1: models/User.js
// ============================================
// This defines what a "User" looks like in our database

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create a blueprint for users
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],  // Can only be 'user' or 'admin'
    default: 'user'
  }
}, {
  timestamps: true  // Automatically add createdAt and updatedAt
});

// Hash password before saving to database
userSchema.pre('save', async function(next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model
module.exports = mongoose.model('User', userSchema);
