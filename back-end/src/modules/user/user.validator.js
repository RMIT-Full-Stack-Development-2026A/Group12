/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Validator
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

const {
  COUNTRY_LIST,
  MARKER_OPTIONS,
  BOARD_STYLES,
  BOARD_SIZES
} = require('../../constants/enums');

const USERNAME_REGEX = /^[A-Za-z0-9_-]{3,30}$/;
const PASSWORD_SPECIAL_REGEX = /[$#@!]/;

function createValidationError(field, message, cause, example) {
  return { field, message, cause, example };
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

module.exports = {
  validateUpdatePayload,
  createValidationError
};
