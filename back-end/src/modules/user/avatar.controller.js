/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Controller
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

const multer = require('multer');
const avatarService = require('./avatar.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      cb(
        new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'avatar'),
        false
      );
      return;
    }

    cb(null, true);
  }
});

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
    const data = await avatarService.updateAvatarByUserId(req.params.user_id, req.file);

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data
    });
  } catch (error) {
    if (error.statusCode && Array.isArray(error.details)) {
      return res.status(error.statusCode).json({
        success: false,
        errors: error.details
      });
    }

    if (error.statusCode) {
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
}

module.exports = {
  uploadAvatarMiddleware,
  updateAvatar
};
