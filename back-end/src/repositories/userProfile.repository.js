const mongoose = require('mongoose');
const User = require('../models/user');
const GameSession = require('../models/gameSession');

function findUserById(userId) {
  return User.findById(userId).exec();
}

function findUserByUsername(username) {
  return User.findOne({ username }).exec();
}

function updateUserById(userId, update) {
  return User.findByIdAndUpdate(userId, { $set: update }, { returnDocument: 'after' }).exec();
}

function updateUserAvatarById(userId, avatarUrl) {
  return User.findByIdAndUpdate(userId, { $set: { avatarUrl } }).exec();
}

function buildGameTypeMatch(gameType) {
  if (!gameType) {
    return null;
  }

  const normalized = String(gameType).toLowerCase();
  const mapping = {
    single_player: 'SINGLE',
    two_player: 'LOCAL',
    online: 'ONLINE'
  };

  return mapping[normalized] ?? gameType;
}

function buildDateRange(query) {
  const range = {};

  if (query.startDate) {
    range.$gte = new Date(`${query.startDate}T00:00:00.000Z`);
  }

  if (query.endDate) {
    range.$lte = new Date(`${query.endDate}T23:59:59.999Z`);
  }

  return Object.keys(range).length > 0 ? range : null;
}

function getSessionHistoryByUserId(userId, query = {}) {
  const objectId = new mongoose.Types.ObjectId(userId);
  const pipeline = [{ $match: { $or: [{ player1Id: objectId }, { player2Id: objectId }] } }];

  const dateRange = buildDateRange(query);
  if (dateRange) {
    pipeline.push({ $match: { startTime: dateRange } });
  }

  if (query.gameType) {
    pipeline.push({ $match: { gameType: buildGameTypeMatch(query.gameType) } });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'player1Id',
        foreignField: '_id',
        as: 'player1User'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'player2Id',
        foreignField: '_id',
        as: 'player2User'
      }
    },
    {
      $addFields: {
        player1User: { $arrayElemAt: ['$player1User', 0] },
        player2User: { $arrayElemAt: ['$player2User', 0] }
      }
    },
    {
      $addFields: {
        sessionIdText: { $toString: '$_id' },
        opponentName: {
          $cond: [
            { $eq: ['$player1Id', objectId] },
            { $ifNull: ['$player2User.username', null] },
            { $ifNull: ['$player1User.username', null] }
          ]
        },
        opponentAvatarUrl: {
          $cond: [
            { $eq: ['$player1Id', objectId] },
            { $ifNull: ['$player2User.avatarUrl', null] },
            { $ifNull: ['$player1User.avatarUrl', null] }
          ]
        }
      }
    }
  );

  if (query.search && query.search.trim()) {
    const search = query.search.trim();
    pipeline.push({
      $match: {
        $or: [
          { opponentName: { $regex: search, $options: 'i' } },
          { sessionIdText: { $regex: search, $options: 'i' } }
        ]
      }
    });
  }

  pipeline.push({
    $sort: {
      startTime: query.sortOrder === 'asc' ? 1 : -1,
      _id: 1
    }
  });

  pipeline.push({ $limit: 500 });

  return GameSession.aggregate(pipeline).exec();
}

function findSessionByUserAndId(userId, sessionId) {
  return GameSession.findOne({
    _id: sessionId,
    $or: [{ player1Id: userId }, { player2Id: userId }]
  }).exec();
}

function deleteSessionById(sessionId) {
  return GameSession.deleteOne({ _id: sessionId }).exec();
}

module.exports = {
  findUserById,
  findUserByUsername,
  updateUserById,
  updateUserAvatarById,
  getSessionHistoryByUserId,
  findSessionByUserAndId,
  deleteSessionById
};