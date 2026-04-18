const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9_-]+$/,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['PLAYER', 'ADMIN'],
    default: 'PLAYER'
  },
  avatarUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },

  isPremium: {
    type: Boolean,
    default: false
  },

  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },

  failedLogins: {
    type: Number,
    default: 0,
    min: 0
  },

  lockUntil: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);