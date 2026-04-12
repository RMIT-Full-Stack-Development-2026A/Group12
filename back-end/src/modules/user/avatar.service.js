/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Service
 * FEATURE  : Avatar Upload
 * BRANCH   : feature/edit-profile
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.2.1
 * ------------------------------------------------------------
 * OWNED BY THIS BRANCH - Do NOT modify from other branches.
 * To use data from this module, import via exposed interface
 * only. Do NOT import Service layer directly (see A.3.1).
 * ============================================================
 */

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const userRepository = require('./user.repository');

function createAppError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) {
    error.details = details;
  }
  return error;
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

  const user = await userRepository.findById(userId);
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
    await userRepository.updateById(userId, { avatarUrl });

    return { avatarUrl };
  } catch (error) {
    throw createAppError(500, 'Failed to process avatar image');
  }
}

module.exports = {
  updateAvatarByUserId
};
