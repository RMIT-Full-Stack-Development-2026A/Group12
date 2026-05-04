const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // id: {
  //   type: String,
  //   required: true,
  //   unique: true
  // },
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
  avatarUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  failedLogins: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);