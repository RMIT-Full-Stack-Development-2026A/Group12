/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Service
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

const mongoose = require('mongoose');
const sessionRepository = require('./session.repository');
const { AI_BOT_NAMES } = require('../../constants/enums');

function toObjectIdString(value) {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  return String(value);
}

function computeResult(session, currentUserId) {
  if (session.status === 'aborted') {
    return 'aborted';
  }

  if (session.status === 'waiting') {
    return null;
  }

  if (session.status === 'finished') {
    if (!session.winnerId) {
      return 'draw';
    }

    return toObjectIdString(session.winnerId) === currentUserId ? 'win' : 'lose';
  }

  return null;
}

function normalizeBoardSize(boardSize) {
  if (boardSize === 10) {
    return '10x10';
  }

  if (boardSize === 15) {
    return '15x15';
  }

  return boardSize || null;
}

async function getSessionHistoryByUserId(userId, query = {}) {
  const sessions = await sessionRepository.findSessionsByUserId(userId, query);
  if (sessions.length === 0) {
    return [];
  }

  return sessions.map((session) => {
    let opponent = { name: null, avatarUrl: null };

    if (session.gameType === 'single_player') {
      opponent = {
        name: AI_BOT_NAMES[session.aiLevel] || 'Bot',
        avatarUrl: null
      };
    } else {
      opponent = {
        name: session.opponentName || null,
        avatarUrl: session.opponentAvatarUrl || null
      };
    }

    return {
      sessionId: toObjectIdString(session._id),
      startTime: session.startTime || null,
      endTime: session.endTime || null,
      gameType: session.gameType,
      boardSize: normalizeBoardSize(session.boardSize),
      status: session.status,
      result: computeResult(session, userId),
      opponent
    };
  });
}

module.exports = {
  getSessionHistoryByUserId
};
