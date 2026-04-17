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
    match: /^[a-zA-Z0-9_-]+$/
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

  preferences: {
    boardSize: Number,
    theme: String,
    marker: String
  }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);