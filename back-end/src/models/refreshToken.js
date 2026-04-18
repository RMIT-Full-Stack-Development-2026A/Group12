const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  token: String,
  expiresAt: Date,
  revoked: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);