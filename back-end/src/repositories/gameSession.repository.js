const GameSession = require('../models/gameSession');

const findById = (sessionId) => {
  return GameSession.findById(sessionId);
};

const create = (payload) => {
  return GameSession.create(payload);
};

const save = (session) => {
  return session.save();
};

const findCurrentByRoomId = (roomId) => {
  return GameSession.findOne({
    roomId,
    endTime: null
  }).sort({ createdAt: -1 });
};

const findLatestByRoomId = (roomId) => {
  return GameSession.findOne({ roomId }).sort({ createdAt: -1 });
};

const findAllByRoomId = (roomId) => {
  return GameSession.find({ roomId }).sort({ createdAt: -1 });
};

const countByRoomId = (roomId) => {
  return GameSession.countDocuments({ roomId });
};

const finishSession = (sessionId, payload) => {
  return GameSession.findByIdAndUpdate(
    sessionId,
    {
      ...payload,
      endTime: new Date()
    },
    { new: true }
  );
};

const findStalePlayingSessions = (cutoffTime) => {
  return GameSession.find({
    status: 'PLAYING',
    gameType: 'ONLINE',
    updatedAt: { $lt: cutoffTime }
  }).select('_id roomId');
};

const abortSession = (sessionId) => {
  return GameSession.findByIdAndUpdate(
    sessionId,
    { status: 'FINISHED', result: 'ABORT', endTime: new Date() },
    { new: true }
  );
};

module.exports = {
  findById,
  create,
  save,
  findCurrentByRoomId,
  findLatestByRoomId,
  findAllByRoomId,
  countByRoomId,
  finishSession,
  findStalePlayingSessions,
  abortSession
};