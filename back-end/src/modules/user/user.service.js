/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Service
 * FEATURE  : Edit Profile
 * BRANCH   : feature/edit-profile
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.1.1 / 3.2.1
 * ------------------------------------------------------------
 * OWNED BY THIS BRANCH - Do NOT modify from other branches.
 * To use data from this module, import via exposed interface
 * only. Do NOT import Service layer directly (see A.3.1).
 * ============================================================
 */

const bcrypt = require('bcryptjs');
const userRepository = require('./user.repository');
const preferenceRepository = require('../preference/preference.repository');
const { toUserProfileDTO } = require('./user.dto');
const {
  validateUpdatePayload,
  createValidationError
} = require('./user.validator');

const SALT_ROUNDS = 12;

function createAppError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) {
    error.details = details;
  }
  return error;
}

function buildSanitizedPayload(body) {
  return {
    username: body.username,
    password: body.password,
    confirmPassword: body.confirmPassword,
    country: body.country,
    preferredMarker: body.preferredMarker,
    preferredBoardStyle: body.preferredBoardStyle,
    preferredBoardSize: body.preferredBoardSize,
    isVipStyle: body.isVipStyle
  };
}

async function getProfileByUserId(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw createAppError(404, 'User not found');
  }

  const preference = await preferenceRepository.findByUserId(userId);
  return toUserProfileDTO(user, preference);
}

async function updateProfileByUserId(userId, body) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw createAppError(404, 'User not found');
  }

  if (!user.isActive) {
    throw createAppError(403, 'Access denied');
  }

  const payload = buildSanitizedPayload(body || {});
  const validationErrors = validateUpdatePayload(payload);

  if (payload.username !== undefined) {
    const existingUser = await userRepository.findByUsername(payload.username.trim());
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

  const shouldUpdateUser = Object.keys(userUpdate).length > 0;
  const shouldUpdatePreference = Object.keys(preferenceUpdate).length > 0;

  let updatedUser = user;
  if (shouldUpdateUser) {
    updatedUser = await userRepository.updateById(userId, userUpdate);
  }

  let preference = await preferenceRepository.findByUserId(userId);
  if (shouldUpdatePreference) {
    if (preferenceUpdate.isVipStyle === true) {
      const latestUser = await userRepository.findById(userId);
      if (!latestUser.isPremium) {
        throw createAppError(403, 'Forbidden', [
          {
            field: 'isVipStyle',
            message: 'VIP Style is only available for Premium subscribers.',
            cause: 'Your account does not have an active Premium subscription.',
            example: 'Subscribe to Premium first, then enable VIP Style.'
          }
        ]);
      }
    }

    if (updatedUser.isPremium !== true) {
      preferenceUpdate.isVipStyle = false;
    }

    preference = await preferenceRepository.upsertByUserId(userId, preferenceUpdate);
  }

  return toUserProfileDTO(updatedUser, preference);
}

module.exports = {
  getProfileByUserId,
  updateProfileByUserId
};
