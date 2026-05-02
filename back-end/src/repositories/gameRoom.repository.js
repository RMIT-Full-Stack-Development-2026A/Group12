const GameRoom = require('../models/gameRoom');

const findById = (roomId) => {
  return GameRoom.findById(roomId);
};

const findByRoomCode = (roomCode) => {
  return GameRoom.findOne({ roomCode });
};

const findByRoomCodeWithPlayers = (roomCode) => {
  return GameRoom.findOne({ roomCode }).populate('players.userId', 'username email avatarUrl');
};

const findWaitingRooms = () => {
  return GameRoom.find({ status: 'WAITING' })
    .populate('players.userId', 'username avatarUrl')
    .sort({ createdAt: -1 })
    .limit(50);
};

const create = (payload) => {
  return GameRoom.create(payload);
};

const save = (room) => {
  return room.save();
};

const updateById = (roomId, payload) => {
  return GameRoom.findByIdAndUpdate(roomId, payload, { new: true });
};

const setCurrentSession = (roomId, sessionId) => {
  return GameRoom.findByIdAndUpdate(
    roomId,
    {
      currentSessionId: sessionId,
      status: 'PLAYING',
      startedAt: new Date()
    },
    { new: true }
  );
};

const clearCurrentSession = (roomId) => {
  return GameRoom.findByIdAndUpdate(
    roomId,
    {
      currentSessionId: null,
      status: 'FINISHED'
    },
    { new: true }
  );
};

const setStatus = (roomId, status) => {
  return GameRoom.findByIdAndUpdate(
    roomId,
    { status },
    { new: true }
  );
};

const setReplayRequests = (roomId, replayRequests) => {
  return GameRoom.findByIdAndUpdate(
    roomId,
    { replayRequests },
    { new: true }
  );
};

module.exports = {
  findById,
  findByRoomCode,
  findByRoomCodeWithPlayers,
  findWaitingRooms,
  create,
  save,
  updateById,
  setCurrentSession,
  clearCurrentSession,
  setStatus,
  setReplayRequests
};