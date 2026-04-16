const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  passwordHash: String,
  country: String,
  avatarUrl: String,
  role: { type: String, default: 'PLAYER' },
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  failedLogins: { type: Number, default: 0 },
  lockUntil: Date
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);