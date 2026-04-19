const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    unique: true
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
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  failedLogins: { type: Number, default: 0 },
  lockUntil: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);