/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Controller
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

const userService = require('./user.service');

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
    const data = await userService.getProfileByUserId(req.params.user_id);
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
    const data = await userService.updateProfileByUserId(req.params.user_id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  getProfile,
  updateProfile
};
