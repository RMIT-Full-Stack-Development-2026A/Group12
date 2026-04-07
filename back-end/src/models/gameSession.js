const mongoose = require('mongoose');

const MoveSchema = new mongoose.Schema({
  moveNumber: Number,
  player: String, // X or O
  position: String, // C2
  timestamp: Date
}, { _id: false });

const GameSessionSchema = new mongoose.Schema({
  player1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  player2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
    enum: ['LOCAL', 'SINGLE', 'ONLINE']
  },

  moves: [MoveSchema], // 🔥 Ultimo

  result: {
    type: String,
    enum: ['PLAYER1_WIN', 'PLAYER2_WIN', 'DRAW', 'ABORT']
  },

  startTime: Date,
  endTime: Date

}, { timestamps: true });

module.exports = mongoose.model('GameSession', GameSessionSchema);