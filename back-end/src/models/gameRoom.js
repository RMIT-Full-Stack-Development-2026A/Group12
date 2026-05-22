const mongoose = require('mongoose');

const ALLOWED_MARKERS = ['X', 'O', 'A', 'B', '△', '○'];
const ALLOWED_MARKER_COLORS = ['#000000', '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0f766e'];

const PlayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mark: {
    type: String,
    enum: ALLOWED_MARKERS,
    required: true
  },
  displayMarker: {
    type: String,
    enum: ALLOWED_MARKERS,
    default: null
  },
  markerColor: {
    type: String,
    enum: ALLOWED_MARKER_COLORS,
    default: null
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
    required: true,
    index: true
  },

  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  players: {
    type: [PlayerSchema],
    default: []
  },

  boardSize: {
    type: Number,
    enum: [3, 10, 15],
    default: 10
  },

  hostMarker: {
    type: String,
    enum: ALLOWED_MARKERS,
    required: true
  },

  status: {
    type: String,
    enum: ['WAITING', 'READY', 'PLAYING', 'FINISHED', 'CLOSED'],
    default: 'WAITING'
  },

  currentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameSession',
    default: null
  },

  replayRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },

  startedAt: {
    type: Date,
    default: null
  },

  closedAt: {
    type: Date,
    default: null
  },

  hostLastSeen: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('GameRoom', GameRoomSchema);