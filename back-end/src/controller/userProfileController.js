/*
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Controller
 * FEATURE  : Edit Profile / Avatar Upload / Session History
 * BRANCH   : nguyen
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.1.1 / 3.2.1 / 3.1.2
 */

const multer = require('multer');
const userProfileService = require('../services/userProfileService');

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

async function getProfile(req, res) {
  try {
    const data = await userProfileService.getProfileByUserId(req.params.user_id);
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
    const data = await userProfileService.updateProfileByUserId(req.params.user_id, req.body);
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
    const data = await userProfileService.updateAvatarByUserId(req.params.user_id, req.file);

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
    const data = await userProfileService.getSessionHistoryByUserId(req.params.user_id, req.query);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

async function deleteSession(req, res) {
  try {
    const data = await userProfileService.deleteSessionByUserId(req.params.user_id, req.params.session_id);
    return res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatarMiddleware,
  updateAvatar,
  getSessionHistory,
  deleteSession
};