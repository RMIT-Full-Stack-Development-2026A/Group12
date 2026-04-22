/*
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Controller (fused minimal layer)
 * FEATURE  : Edit Profile / Avatar Upload / Session History
 * BRANCH   : nguyen
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.1.1 / 3.2.1 / 3.1.2
 */

const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require('sharp');
const mongoose = require('mongoose');
const PlayerPreference = require('../preference/preference.model');
const {
  COUNTRY_LIST,
  MARKER_OPTIONS,
  BOARD_STYLES,
  BOARD_SIZES,
  AI_BOT_NAMES
} = require('../../constants/enums');

let User;
try {
  User = require('../../models/user.model');
} catch {
  User = require('../../models/user');
}

let GameSession;
try {
  GameSession = require('../../models/gameSession.model');
} catch {
  GameSession = require('../../models/gameSession');
}

const SALT_ROUNDS = 12;
const USERNAME_REGEX = /^[A-Za-z0-9_-]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_SPECIAL_REGEX = /[$#@!]/;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'avatar'), false);
      return;
    }

    cb(null, true);
  }
});

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

function mapPreference(user, preference) {
  if (!preference) {
    return null;
  }

  return {
    preferredMarker: preference.preferredMarker,
    preferredBoardStyle: preference.preferredBoardStyle,
    preferredBoardSize: preference.preferredBoardSize,
    isVipStyle: user.isPremium ? Boolean(preference.isVipStyle) : false
  };
}

function toUserProfileDTO(user, preference) {
  return {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    country: user.country,
    avatarUrl: user.avatarUrl || null,
    isPremium: Boolean(user.isPremium),
    role: user.role,
    preference: mapPreference(user, preference)
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

function normalizeEmail(value) {
  return String(value).trim().toLowerCase();
}

function validateEmail(email) {
  if (typeof email !== 'string' || email.trim().length === 0) {
    return createValidationError(
      'email',
      'Email must be a valid address. Example: player01@gmail.com',
      'Email is empty or not a string',
      'player01@gmail.com'
    );
  }

  const value = normalizeEmail(email);
  if (!EMAIL_REGEX.test(value)) {
    return createValidationError(
      'email',
      'Email must be a valid address. Example: player01@gmail.com',
      'Email format is invalid',
      'player01@gmail.com'
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

function validatePreferredMarker(marker) {
  if (!MARKER_OPTIONS.includes(marker)) {
    return createValidationError(
      'preferredMarker',
      'Marker must be one of the 6 available options',
      'Marker is outside allowed enum values',
      MARKER_OPTIONS[0]
    );
  }

  return null;
}

function validatePreferredBoardStyle(style) {
  if (!BOARD_STYLES.includes(style)) {
    return createValidationError(
      'preferredBoardStyle',
      'Board style must be 1, 2, or 3',
      'Board style is outside allowed enum values',
      '2'
    );
  }

  return null;
}

function validatePreferredBoardSize(size) {
  if (!BOARD_SIZES.includes(size)) {
    return createValidationError(
      'preferredBoardSize',
      'Board size must be either 10x10 or 15x15',
      'Board size is outside allowed enum values',
      '10x10'
    );
  }

  return null;
}

function validateIsVipStyle(isVipStyle) {
  if (typeof isVipStyle !== 'boolean') {
    return createValidationError(
      'isVipStyle',
      'isVipStyle must be true or false',
      'isVipStyle is not a boolean value',
      'true'
    );
  }

  return null;
}

function validateUpdatePayload(payload) {
  const errors = [];

  const hasUserField =
    payload.email !== undefined ||
    payload.username !== undefined ||
    payload.password !== undefined ||
    payload.country !== undefined;

  const hasPreferenceField =
    payload.preferredMarker !== undefined ||
    payload.preferredBoardStyle !== undefined ||
    payload.preferredBoardSize !== undefined ||
    payload.isVipStyle !== undefined;

  if (!hasUserField && !hasPreferenceField) {
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

  if (payload.email !== undefined) {
    const emailError = validateEmail(payload.email);
    if (emailError) {
      errors.push(emailError);
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

  if (payload.preferredMarker !== undefined) {
    const markerError = validatePreferredMarker(payload.preferredMarker);
    if (markerError) {
      errors.push(markerError);
    }
  }

  if (payload.preferredBoardStyle !== undefined) {
    const styleError = validatePreferredBoardStyle(payload.preferredBoardStyle);
    if (styleError) {
      errors.push(styleError);
    }
  }

  if (payload.preferredBoardSize !== undefined) {
    const sizeError = validatePreferredBoardSize(payload.preferredBoardSize);
    if (sizeError) {
      errors.push(sizeError);
    }
  }

  if (payload.isVipStyle !== undefined) {
    const vipError = validateIsVipStyle(payload.isVipStyle);
    if (vipError) {
      errors.push(vipError);
    }
  }

  return errors;
}

function handleError(res, error) {
  if (error.statusCode === 400 && Array.isArray(error.details)) {
    return res.status(400).json({
      success: false,
      errors: error.details
    });
  }

  if (error.statusCode) {
    if (Array.isArray(error.details)) {
      return res.status(error.statusCode).json({
        success: false,
        errors: error.details
      });
    }

    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}

function mapUploadError(error) {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return {
      statusCode: 400,
      body: {
        success: false,
        errors: [
          {
            field: 'avatar',
            message: 'Avatar size must be 5MB or less',
            cause: 'File exceeds maximum size limit of 5MB',
            example: 'profile.jpg'
          }
        ]
      }
    };
  }

  if (error instanceof multer.MulterError) {
    return {
      statusCode: 400,
      body: {
        success: false,
        errors: [
          {
            field: 'avatar',
            message: 'Only JPG, PNG, or WEBP images are allowed',
            cause: 'Invalid file type',
            example: 'profile.jpg'
          }
        ]
      }
    };
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

function normalizeGameType(gameType) {
  const value = (gameType || '').toString().toLowerCase();
  if (value === 'single' || value === 'single_player') {
    return 'single_player';
  }

  if (value === 'local' || value === 'two_player') {
    return 'two_player';
  }

  if (value === 'online') {
    return 'online';
  }

  return value || null;
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

  if (status === 'aborted' || legacyResult === 'ABORT') {
    return 'aborted';
  }

  if (status === 'waiting') {
    return null;
  }

  if (legacyResult === 'DRAW') {
    return 'draw';
  }

  if (legacyResult === 'PLAYER1_WIN') {
    return toObjectIdString(session.player1Id) === currentUserId ? 'win' : 'lose';
  }

  if (legacyResult === 'PLAYER2_WIN') {
    return toObjectIdString(session.player2Id) === currentUserId ? 'win' : 'lose';
  }

  if (status === 'finished') {
    if (!session.winnerId) {
      return 'draw';
    }

    return toObjectIdString(session.winnerId) === currentUserId ? 'win' : 'lose';
  }

  return null;
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

function buildGameTypeMatch(gameType) {
  if (!gameType) {
    return null;
  }

  const normalized = String(gameType).toLowerCase();

  const mapping = {
    single_player: ['single_player', 'SINGLE'],
    two_player: ['two_player', 'LOCAL'],
    online: ['online', 'ONLINE']
  };

  return mapping[normalized] ? { $in: mapping[normalized] } : gameType;
}

async function getProfileByUserId(userId) {
  const user = await User.findById(userId).exec();
  if (!user) {
    throw createAppError(404, 'User not found');
  }

  const preference = await PlayerPreference.findOne({ userId }).exec();
  return toUserProfileDTO(user, preference);
}

async function updateProfileByUserId(userId, body) {
  const user = await User.findById(userId).exec();
  if (!user) {
    throw createAppError(404, 'User not found');
  }

  if (!user.isActive) {
    throw createAppError(403, 'Access denied');
  }

  const payload = {
    email: body?.email,
    username: body?.username,
    password: body?.password,
    confirmPassword: body?.confirmPassword,
    country: body?.country,
    preferredMarker: body?.preferredMarker,
    preferredBoardStyle: body?.preferredBoardStyle,
    preferredBoardSize: body?.preferredBoardSize,
    isVipStyle: body?.isVipStyle
  };

  const validationErrors = validateUpdatePayload(payload);

  if (payload.username !== undefined) {
    const existingUser = await User.findOne({ username: payload.username.trim() }).exec();
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

  if (payload.email !== undefined) {
    const normalizedEmail = normalizeEmail(payload.email);
    const existingUser = await User.findOne({ email: normalizedEmail }).exec();
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      validationErrors.push(
        createValidationError(
          'email',
          'Email must be unique',
          'Another account already uses this email address',
          'player01@gmail.com'
        )
      );
    }
  }

  if (validationErrors.length > 0) {
    throw createAppError(400, 'Validation failed', validationErrors);
  }

  const userUpdate = {};
  if (payload.email !== undefined) {
    userUpdate.email = normalizeEmail(payload.email);
  }
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
    updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: userUpdate },
      { returnDocument: 'after' }
    ).exec();
  }

  const preferenceUpdate = {};
  if (payload.preferredMarker !== undefined) {
    preferenceUpdate.preferredMarker = payload.preferredMarker;
  }
  if (payload.preferredBoardStyle !== undefined) {
    preferenceUpdate.preferredBoardStyle = payload.preferredBoardStyle;
  }
  if (payload.preferredBoardSize !== undefined) {
    preferenceUpdate.preferredBoardSize = payload.preferredBoardSize;
  }
  if (payload.isVipStyle !== undefined) {
    preferenceUpdate.isVipStyle = payload.isVipStyle;
  }

  let preference = await PlayerPreference.findOne({ userId }).exec();
  if (Object.keys(preferenceUpdate).length > 0) {
    if (preferenceUpdate.isVipStyle === true && !updatedUser.isPremium) {
      throw createAppError(403, 'Forbidden', [
        {
          field: 'isVipStyle',
          message: 'VIP Style is only available for Premium subscribers.',
          cause: 'Your account does not have an active Premium subscription.',
          example: 'Subscribe to Premium first, then enable VIP Style.'
        }
      ]);
    }

    if (updatedUser.isPremium !== true) {
      preferenceUpdate.isVipStyle = false;
    }

    preference = await PlayerPreference.findOneAndUpdate(
      { userId },
      { $set: preferenceUpdate, $setOnInsert: { userId } },
      { returnDocument: 'after', upsert: true }
    ).exec();
  }

  return toUserProfileDTO(updatedUser, preference);
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

  const user = await User.findById(userId).exec();
  if (!user) {
    throw createAppError(404, 'User not found');
  }

  try {
    const resizedBuffer = await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const avatarsDir = path.resolve(__dirname, '../../..', 'uploads', 'avatars');
    await fs.mkdir(avatarsDir, { recursive: true });

    const fileName = `${userId}.jpg`;
    const absolutePath = path.join(avatarsDir, fileName);
    await fs.writeFile(absolutePath, resizedBuffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;
    await User.findByIdAndUpdate(userId, { $set: { avatarUrl } }).exec();

    return { avatarUrl };
  } catch {
    throw createAppError(500, 'Failed to process avatar image');
  }
}

async function getSessionHistoryByUserId(userId, query = {}) {
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

  const sessions = await GameSession.aggregate(pipeline).exec();

  return sessions.map((session) => {
    const normalizedGameType = normalizeGameType(session.gameType);
    const opponent =
      normalizedGameType === 'single_player'
        ? { name: AI_BOT_NAMES[session.aiLevel] || 'Bot', avatarUrl: null }
        : { name: session.opponentName || null, avatarUrl: session.opponentAvatarUrl || null };

    return {
      sessionId: toObjectIdString(session._id),
      startTime: session.startTime || null,
      endTime: session.endTime || null,
      gameType: normalizedGameType,
      boardSize: normalizeBoardSize(session.boardSize),
      status: normalizeStatus(session.status, session.result),
      result: computeResult(session, userId),
      opponent
    };
  });
}

function handleError(res, error) {
  if (error.statusCode === 400 && Array.isArray(error.details)) {
    return res.status(400).json({
      success: false,
      errors: error.details
    });
  }

  if (error.statusCode) {
    if (Array.isArray(error.details)) {
      return res.status(error.statusCode).json({
        success: false,
        errors: error.details
      });
    }

    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}

async function getProfile(req, res) {
  try {
    const data = await getProfileByUserId(req.params.user_id);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

async function updateProfile(req, res) {
  try {
    const data = await updateProfileByUserId(req.params.user_id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

async function uploadAvatarMiddleware(req, res, next) {
  try {
    await new Promise((resolve, reject) => {
      upload.single('avatar')(req, res, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    return next();
  } catch (error) {
    const mapped = mapUploadError(error);
    if (mapped) {
      return res.status(mapped.statusCode).json(mapped.body);
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function updateAvatar(req, res) {
  try {
    const data = await updateAvatarByUserId(req.params.user_id, req.file);

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

async function getSessionHistory(req, res) {
  try {
    const data = await getSessionHistoryByUserId(req.params.user_id, req.query);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatarMiddleware,
  updateAvatar,
  getSessionHistory
};
