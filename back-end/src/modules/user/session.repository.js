/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Repository
 * FEATURE  : Session History
 * BRANCH   : feature/edit-profile
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.1.2
 * ------------------------------------------------------------
 * OWNED BY THIS BRANCH - Do NOT modify from other branches.
 * To use data from this module, import via exposed interface
 * only. Do NOT import Service layer directly (see A.3.1).
 * ============================================================
 */

/*
 * DEPENDENCY NOTE:
 * This file imports from: ../../models/user.model.js
 * That file is OWNED BY: feature/register branch
 * Expected exports   : User mongoose model
 * If that file does not exist yet, use _stubs/user.model.stub.js.
 */

const mongoose = require('mongoose');

let User;
if (process.env.NODE_ENV === 'test' || process.env.USE_STUBS === 'true') {
  try {
    User = require('../../models/user.model');
  } catch {
    User = require('../../_stubs/user.model.stub');
    console.warn('[STUB ACTIVE]', __filename);
  }
} else {
  User = require('../../models/user.model');
}

let GameSession;
if (process.env.NODE_ENV === 'test' || process.env.USE_STUBS === 'true') {
  try {
    GameSession = require('../../models/gameSession.model');
  } catch {
    GameSession = require('../../_stubs/gameSession.model.stub');
    console.warn('[STUB ACTIVE]', __filename);
  }
} else {
  GameSession = require('../../models/gameSession.model');
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

function buildResultMatch(result, currentUserId) {
  if (!result) {
    return null;
  }

  if (result === 'win') {
    return { status: 'finished', winnerId: currentUserId };
  }

  if (result === 'lose') {
    return {
      status: 'finished',
      $expr: {
        $and: [
          { $ne: ['$winnerId', null] },
          { $ne: ['$winnerId', currentUserId] }
        ]
      }
    };
  }

  if (result === 'aborted') {
    return { status: 'aborted' };
  }

  return null;
}

async function findSessionsByUserId(userId, query = {}) {
  const objectId = new mongoose.Types.ObjectId(userId);
  const pipeline = [{ $match: { $or: [{ player1Id: objectId }, { player2Id: objectId }] } }];

  const resultMatch = buildResultMatch(query.result, objectId);
  if (resultMatch) {
    pipeline.push({ $match: resultMatch });
  }

  const dateRange = buildDateRange(query);
  if (dateRange) {
    pipeline.push({ $match: { startTime: dateRange } });
  }

  if (query.gameType) {
    pipeline.push({ $match: { gameType: query.gameType } });
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

  return GameSession.aggregate(pipeline).exec();
}

async function findUsersByIds(userIds) {
  return User.find(
    { _id: { $in: userIds } },
    { username: 1, avatarUrl: 1 }
  ).lean().exec();
}

module.exports = {
  findSessionsByUserId,
  findUsersByIds
};
