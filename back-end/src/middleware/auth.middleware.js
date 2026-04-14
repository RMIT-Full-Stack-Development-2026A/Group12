// Module: User Profile
// Layer: Middleware
// Feature: Edit Profile (Requirement 3.1.1, 3.2.1)

const jwt = require('jsonwebtoken');

let User;
try {
  User = require('../models/user.model');
} catch {
  User = require('../models/user');
}

function getTokenFromHeader(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const [type, token] = authorizationHeader.split(' ');
  if (type !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

async function authenticateJWT(req, res, next) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const tokenUserId = payload.userId || payload.user_id || payload.sub;

    if (!tokenUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const authUser = await User.findById(tokenUserId.toString()).exec();
    if (authUser && authUser.isActive === false) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated.',
          cause: 'An administrator has disabled your account.',
          action: 'Please contact support at support@tictactoang.com to reactivate.'
        }
      });
    }

    req.auth = {
      token,
      userId: tokenUserId.toString(),
      role: payload.role
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

function authorizeOwnership(req, res, next) {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.auth.userId !== req.params.user_id) {
    return res.status(403).json({
      success: false,
      error: "You cannot access another user's profile"
    });
  }

  return next();
}

module.exports = {
  authenticateJWT,
  authorizeOwnership
};
