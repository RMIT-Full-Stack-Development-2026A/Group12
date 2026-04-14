const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const PlayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mark: {
    type: String,
    enum: ['X', 'O'],
    required: true
  },
  connected: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const GameRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    unique: true,
    required: true
  },

  players: {
    type: [PlayerSchema],
    default: []
  },

  currentTurn: {
    type: String,
    enum: ['X', 'O'],
    default: 'X'
  },

  status: {
    type: String,
    enum: ['WAITING', 'PLAYING', 'CLOSED'],
    default: 'WAITING'
  },

  chat: {
    type: [ChatSchema],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  startedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('GameRoom', GameRoomSchema);