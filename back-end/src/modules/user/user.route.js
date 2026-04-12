/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Route
 * FEATURE  : Edit Profile / Avatar Upload / Session History
 * BRANCH   : feature/edit-profile
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.1.1 / 3.2.1 / 3.1.2
 * ------------------------------------------------------------
 * OWNED BY THIS BRANCH - Do NOT modify from other branches.
 * To use data from this module, import via exposed interface
 * only. Do NOT import Service layer directly (see A.3.1).
 * ============================================================
 */

/*
 * DEPENDENCY NOTE:
 * This file imports from: ../../middleware/auth.middleware.js
 * That file is OWNED BY: feature/login branch
 * Expected exports   : { authenticate, checkOwnership }
 * If that file does not exist yet, create a STUB version:
 *   module.exports = {
 *     authenticate: (req, res, next) => next(),
 *     checkOwnership: (req, res, next) => next()
 *   };
 * Remove stub once feature/login is merged into main.
 */

const express = require('express');
const userController = require('./user.controller');
const avatarController = require('./avatar.controller');
const sessionController = require('./session.controller');

let authMiddleware;
if (process.env.NODE_ENV === 'test' || process.env.USE_STUBS === 'true') {
  try {
    authMiddleware = require('../../middleware/auth.middleware');
  } catch {
    authMiddleware = require('../../_stubs/auth.middleware.stub');
    console.warn('[STUB ACTIVE]', __filename);
  }
} else {
  authMiddleware = require('../../middleware/auth.middleware');
}

const authenticate = authMiddleware.authenticate || authMiddleware.authenticateJWT;
const checkOwnership = authMiddleware.checkOwnership || authMiddleware.authorizeOwnership;

const router = express.Router();

router.use(authenticate);

router.get('/:user_id', checkOwnership, userController.getProfile);
router.get('/:user_id/sessions', checkOwnership, sessionController.getSessionHistory);
router.put('/:user_id', checkOwnership, userController.updateProfile);
router.patch(
  '/:user_id/avatar',
  checkOwnership,
  avatarController.uploadAvatarMiddleware,
  avatarController.updateAvatar
);

module.exports = router;
