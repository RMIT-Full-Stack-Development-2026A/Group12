const mongoose = require('mongoose');

const MoveSchema = new mongoose.Schema({
  moveNumber: Number,
  player: String,
  position: String,
  timestamp: Date
}, { _id: false });

const GameSessionSchema = new mongoose.Schema({
  player1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  player2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  aiLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  },

  boardSize: {
    type: Number,
    enum: [10, 15],
    default: 10
  },

  gameType: {
    type: String,
    enum: ['LOCAL', 'SINGLE', 'ONLINE'],
    required: true
  },

  moves: {
    type: [MoveSchema],
    default: []
  },

  result: {
    type: String,
    enum: ['PLAYER1_WIN', 'PLAYER2_WIN', 'DRAW', 'ABORT'],
    default: null
  },

  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('GameSession', GameSessionSchema);
