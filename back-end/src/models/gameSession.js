const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema(
  {
    player1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    player2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    gameType: {
      type: String,
      default: null
    },
    aiLevel: {
      type: String,
      default: null
    },
    boardSize: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    status: {
      type: String,
      default: null
    },
    result: {
      type: String,
      default: null
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.GameSession ||
  mongoose.model('GameSession', GameSessionSchema);
