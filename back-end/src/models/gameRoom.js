import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  senderId: mongoose.Schema.Types.ObjectId,
  message: String,
  timestamp: Date
}, { _id: false });

const PlayerSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  mark: String,
  connected: Boolean
}, { _id: false });

const GameRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    unique: true
  },

  players: [PlayerSchema],

  currentTurn: String,

  status: {
    type: String,
    enum: ['WAITING', 'PLAYING', 'CLOSED']
  },

  chat: [ChatSchema],

  createdAt: Date,
  startedAt: Date

});

export default  mongoose.model('GameRoom', GameRoomSchema);