const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');

const { COUNTRY_LIST, AI_BOT_NAMES } = require('../constants/enums');
const userProfileRepository = require('../repositories/userProfile.repository');

const BOT_NAME_MAP = AI_BOT_NAMES || {
  easy: 'Easy Bot',
  medium: 'Medium Bot',
  hard: 'Hard Bot'
};

const SALT_ROUNDS = 12;
const USERNAME_REGEX = /^[A-Za-z0-9_-]{3,30}$/;
const PASSWORD_SPECIAL_REGEX = /[$#@!]/;

function createValidationError(field, message, cause, example) {
  return { field, message, cause, example };
}

function createAppError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) {
    error.details = details;
  }
  return error;
}

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

function toUserProfileDTO(user) {
  return {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    country: user.country,
    avatarUrl: user.avatarUrl || null,
    isPremium: Boolean(user.isPremium),
    premiumExpiryDate: user.premiumExpiryDate || null,
    role: user.role
  };
}

function validateUsername(username) {
  if (typeof username !== 'string' || username.trim().length === 0) {
    return createValidationError(
      'username',
      'Username must contain only letters, numbers, _ or -. Example: player_01, John-Doe',
      'Username is empty or not a string',
      'player_01'
    );
  }

  const value = username.trim();
  if (!USERNAME_REGEX.test(value)) {
    return createValidationError(
      'username',
      'Username must contain only letters, numbers, _ or -. Example: player_01, John-Doe',
      'Contains unsupported characters or length is not between 3 and 30',
      'John-Doe'
    );
  }

  return null;
}

function validatePassword(password, confirmPassword) {
  const errors = [];

  if (typeof password !== 'string') {
    errors.push(
      createValidationError(
        'password',
        'Password must be at least 8 characters and include uppercase, number, and special character ($, #, @, !).',
        'Password is not a string',
        'MyPass@123'
      )
    );
    return errors;
  }

  if (password.length < 8) {
    errors.push(
      createValidationError(
        'password',
        'Password must be at least 8 characters and include uppercase, number, and special character ($, #, @, !).',
        'Too short (minimum is 8)',
        'MyPass@123'
      )
    );
  }

  if (!/[A-Z]/.test(password)) {
    errors.push(
      createValidationError(
        'password',
        'Password must be at least 8 characters and include uppercase, number, and special character ($, #, @, !).',
        'Missing uppercase letter',
        'MyPass@123'
      )
    );
  }

  if (!/[0-9]/.test(password)) {
    errors.push(
      createValidationError(
        'password',
        'Password must be at least 8 characters and include uppercase, number, and special character ($, #, @, !).',
        'Missing number',
        'MyPass@123'
      )
    );
  }

  if (!PASSWORD_SPECIAL_REGEX.test(password)) {
    errors.push(
      createValidationError(
        'password',
        'Password must be at least 8 characters and include uppercase, number, and special character ($, #, @, !).',
        'Missing special character ($, #, @, !)',
        'MyPass@123'
      )
    );
  }

  if (password !== confirmPassword) {
    errors.push(
      createValidationError(
        'confirmPassword',
        'Confirm password must exactly match the new password.',
        'password and confirmPassword are different',
        'MyPass@123'
      )
    );
  }

  return errors;
}

function validateCountry(country) {
  if (!COUNTRY_LIST.includes(country)) {
    return createValidationError(
      'country',
      'Country must be selected from the provided list',
      'Country is not in enum list',
      COUNTRY_LIST[0]
    );
  }

  return null;
}

function validateUpdatePayload(payload) {
  const errors = [];

  const hasUserField =
    payload.username !== undefined ||
    payload.password !== undefined ||
    payload.country !== undefined;

  if (!hasUserField) {
    errors.push(
      createValidationError(
        'body',
        'Nothing to update',
        'No editable fields were provided',
        '{ "username": "player_01" }'
      )
    );
    return errors;
  }

  if (payload.username !== undefined) {
    const usernameError = validateUsername(payload.username);
    if (usernameError) {
      errors.push(usernameError);
    }
  }

  if (payload.password !== undefined || payload.confirmPassword !== undefined) {
    errors.push(...validatePassword(payload.password, payload.confirmPassword));
  }

  if (payload.country !== undefined) {
    const countryError = validateCountry(payload.country);
    if (countryError) {
      errors.push(countryError);
    }
  }

  return errors;
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

const GAME_TYPE_MAP = {
  single: 'single_player', single_player: 'single_player',
  local: 'two_player', two_player: 'two_player',
  online: 'online',
};

function normalizeGameType(gameType) {
  const value = (gameType || '').toString().toLowerCase();
  return (GAME_TYPE_MAP[value] ?? value) || null;
}

function normalizeStatus(status, result) {
  const normalizedStatus = (status || '').toString().toLowerCase();
  const normalizedResult = (result || '').toString().toUpperCase();

  if (normalizedStatus) {
    return normalizedStatus;
  }

  if (normalizedResult === 'ABORT') {
    return 'aborted';
  }

  if (normalizedResult === 'PLAYER1_WIN' || normalizedResult === 'PLAYER2_WIN' || normalizedResult === 'DRAW') {
    return 'finished';
  }

  return null;
}

function computeResult(session, currentUserId) {
  const status = (session.status || '').toString().toLowerCase();
  const legacyResult = (session.result || '').toString().toUpperCase();
  const player1Id = toObjectIdString(session.player1Id);
  const player2Id = toObjectIdString(session.player2Id);
  const winnerMarker = (session.winner || '').toString();

  if (status === 'aborted' || legacyResult === 'ABORT') {
    return 'aborted';
  }

  if (status === 'waiting' || status === 'playing') {
    return null;
  }

  if (status === 'draw' || legacyResult === 'DRAW') {
    return 'draw';
  }

  if (legacyResult === 'PLAYER1_WIN') {
    return toObjectIdString(session.player1Id) === currentUserId ? 'win' : 'lose';
  }

  if (legacyResult === 'PLAYER2_WIN') {
    return toObjectIdString(session.player2Id) === currentUserId ? 'win' : 'lose';
  }

  if (status === 'win' && winnerMarker) {
    if (winnerMarker === session.player1Marker) {
      return player1Id === currentUserId ? 'win' : 'lose';
    }

    if (winnerMarker === session.player2Marker) {
      return player2Id === currentUserId ? 'win' : 'lose';
    }
  }

  if (status === 'finished') {
    return null;
  }

  return null;
}

function mapSession(session, userId) {
  const normalizedGameType = normalizeGameType(session.gameType);
  const opponent =
    normalizedGameType === 'single_player'
      ? { name: BOT_NAME_MAP[session.aiLevel] || 'Bot', avatarUrl: null }
      : { name: session.opponentName || null, avatarUrl: session.opponentAvatarUrl || null };

  return {
    sessionId: toObjectIdString(session._id),
    startTime: session.startTime || null,
    endTime: session.endTime || null,
    gameType: normalizedGameType,
    boardSize: normalizeBoardSize(session.boardSize),
    status: normalizeStatus(session.status, session.result),
    result: computeResult(session, userId),
    opponent,
    aiLevel: session.aiLevel || null,
    moves: Array.isArray(session.moves) ? session.moves : [],
    player1Marker: session.player1Marker || null,
    player2Marker: session.player2Marker || null
  };
}

async function getProfileByUserId(userId) {
  const user = await userProfileRepository.findUserById(userId);
  if (!user) {
    throw createAppError(404, 'User not found');
  }

  return toUserProfileDTO(user);
}

async function updateProfileByUserId(userId, body) {
  const user = await userProfileRepository.findUserById(userId);
  if (!user) {
    throw createAppError(404, 'User not found');
  }

  if (!user.isActive) {
    throw createAppError(403, 'Access denied');
  }

  const payload = {
    username: body?.username,
    password: body?.password,
    confirmPassword: body?.confirmPassword,
    country: body?.country
  };

  const validationErrors = validateUpdatePayload(payload);

  if (payload.username !== undefined) {
    const existingUser = await userProfileRepository.findUserByUsername(payload.username.trim());
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      validationErrors.push(
        createValidationError(
          'username',
          'Username must be unique',
          'Another account already uses this username',
          'player_01'
        )
      );
    }
  }

  if (validationErrors.length > 0) {
    throw createAppError(400, 'Validation failed', validationErrors);
  }

  const userUpdate = {};
  if (payload.username !== undefined) {
    userUpdate.username = payload.username.trim();
  }
  if (payload.country !== undefined) {
    userUpdate.country = payload.country;
  }
  if (payload.password !== undefined) {
    userUpdate.passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);
  }

  let updatedUser = user;
  if (Object.keys(userUpdate).length > 0) {
    updatedUser = await userProfileRepository.updateUserById(userId, userUpdate);
  }

  return toUserProfileDTO(updatedUser);
}

async function updateAvatarByUserId(userId, file) {
  if (!file) {
    throw createAppError(400, 'Validation failed', [
      {
        field: 'avatar',
        message: 'Avatar file is required',
        cause: 'No file was uploaded in form-data with field name avatar',
        example: 'profile.jpg'
      }
    ]);
  }

  const user = await userProfileRepository.findUserById(userId);
  if (!user) {
    throw createAppError(404, 'User not found');
  }

  try {
    const resizedBuffer = await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const avatarsDir = path.resolve(__dirname, '../..', 'uploads', 'avatars');
    await fs.mkdir(avatarsDir, { recursive: true });

    const fileName = `${userId}.jpg`;
    const absolutePath = path.join(avatarsDir, fileName);
    await fs.writeFile(absolutePath, resizedBuffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;
    await userProfileRepository.updateUserAvatarById(userId, avatarUrl);

    return { avatarUrl };
  } catch {
    throw createAppError(500, 'Failed to process avatar image');
  }
}

async function getSessionHistoryByUserId(userId, query = {}) {
  const sessions = await userProfileRepository.getSessionHistoryByUserId(userId, query);
  const mappedSessions = sessions.map((session) => mapSession(session, userId));

  const requestedResult = query.result ? String(query.result).toLowerCase() : '';
  if (!requestedResult) {
    return mappedSessions;
  }

  if (requestedResult === 'aborted') {
    return mappedSessions.filter(
      (session) =>
        session.result === 'aborted'
        || session.result === null
        || session.result === undefined
        || session.result === ''
    );
  }

  return mappedSessions.filter((session) => session.result === requestedResult);
}

async function deleteSessionByUserId(userId, sessionId) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw createAppError(400, 'Invalid session id');
  }

  const session = await userProfileRepository.findSessionByUserAndId(userId, sessionId);

  if (!session) {
    throw createAppError(404, 'Session not found');
  }

  await userProfileRepository.deleteSessionById(sessionId);

  return {
    sessionId,
    deleted: true
  };
}

module.exports = {
  getProfileByUserId,
  updateProfileByUserId,
  updateAvatarByUserId,
  getSessionHistoryByUserId,
  deleteSessionByUserId
};