// Module: User Profile
// Layer: Model
// Feature: Edit Profile (Requirement 3.1.1, 3.2.1)

const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'tokenblacklists'
  }
);

module.exports =
  mongoose.models.TokenBlacklist ||
  mongoose.model('TokenBlacklist', tokenBlacklistSchema);
