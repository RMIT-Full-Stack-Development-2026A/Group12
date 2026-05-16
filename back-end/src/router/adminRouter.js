const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwtConfig');
const User = require('../models/user');
const {
  getAllUsers,
  getOngoingMatches,
  stopMatch,
  getUserById,
  deleteUser,
  suspendUser,
  unsuspendUser,
  getActiveSubscriptions,
  getAllTransactions,
  getTransactionStats,
} = require('../controller/adminController');

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.userId || payload.user_id || payload.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: error.message,
    });
  }
};

// Apply admin middleware to all routes
router.use(authenticateAdmin);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/suspend', suspendUser);
router.patch('/users/:userId/unsuspend', unsuspendUser);

// Match management routes
router.get('/matches', getOngoingMatches);
router.post('/matches/:matchId/stop', stopMatch);

// Subscription management routes
router.get('/subscriptions', getActiveSubscriptions);

// Transaction management routes
router.get('/transactions', getAllTransactions);
router.get('/transactions/stats', getTransactionStats);

module.exports = router;
