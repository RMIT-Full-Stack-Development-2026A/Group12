/*
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Route
 * FEATURE  : Edit Profile / Avatar Upload / Session History
 * BRANCH   : nguyen
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.1.1 / 3.2.1 / 3.1.2
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
router.get('/:user_id/sessions', checkOwnership, userController.getSessionHistory);
router.put('/:user_id', checkOwnership, userController.updateProfile);
router.patch(
  '/:user_id/avatar',
  checkOwnership,
  userController.uploadAvatarMiddleware,
  userController.updateAvatar
);

module.exports = router;
