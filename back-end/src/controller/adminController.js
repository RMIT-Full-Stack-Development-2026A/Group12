const { getIO } = require('../socket');
const User = require('../models/user');
const Subscription = require('../models/subscription');
const Transaction = require('../models/transaction');
const roomRepo = require('../repositories/gameRoom.repository');
const sessionRepo = require('../repositories/gameSession.repository');


// ================= USERS =================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: users,
      total: users.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

const getOngoingMatches = async (req, res) => {
  try {
    const sessions = await sessionRepo.findOngoingMatches();

    res.status(200).json({
      success: true,
      data: sessions,
      total: sessions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ongoing matches',
      error: error.message
    });
  }
};

const stopMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { reason = 'Admin stopped the match' } = req.body;

    const session = await sessionRepo.findById(matchId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (session.status === 'FINISHED' || session.status === 'WIN' || session.status === 'DRAW') {
      return res.status(400).json({ success: false, message: 'Match is already finished' });
    }

    const updatedSession = await sessionRepo.finishSession(matchId, {
      status: 'FINISHED',
      result: 'ABORT',
      winner: null
    });

    if (session.roomCode) {
      const room = await roomRepo.findByRoomCode(session.roomCode);
      if (room) {
        room.status = 'FINISHED';
        room.currentSessionId = null;
        room.replayRequests = [];
        await roomRepo.save(room);
      }
    }

    try {
      const io = getIO();
      const notification = {
        action: 'stopped',
        sessionId: matchId,
        reason,
        message: `Admin stopped this match: ${reason}`
      };
      if (session.roomCode) {
        io.to(session.roomCode).emit('admin_notification', notification);
      }
      io.to(`session:${matchId}`).emit('admin_notification', notification);
    } catch (e) {
      // ignore socket errors
    }

    res.status(200).json({
      success: true,
      message: 'Match stopped successfully',
      data: updatedSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop match',
      error: error.message
    });
  }
};


// ================= USER BY ID =================
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-passwordHash')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};


// ================= DELETE USER =================
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await Promise.all([
      Subscription.deleteMany({ userId }),
      Transaction.deleteMany({ userId })
    ]);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};


// ================= SUSPEND =================
const suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User suspended successfully',
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message
    });
  }
};


// ================= UNSUSPEND =================
const unsuspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: true },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User unsuspended successfully',
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unsuspend user',
      error: error.message
    });
  }
};


// ================= SUBSCRIPTIONS =================
const getActiveSubscriptions = async (req, res) => {
  try {
    const now = new Date();

    const subscriptions = await Subscription.find({
      isPremium: true,
      endDate: { $gt: now }
    })
      .populate('userId', 'username email')
      .sort({ endDate: 1 }) // expiring soonest first
      .lean();

    res.status(200).json({
      success: true,
      data: subscriptions,
      total: subscriptions.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
};


// ================= TRANSACTIONS =================
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: transactions,
      total: transactions.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};


// ================= STATS =================
const getTransactionStats = async (req, res) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction stats',
      error: error.message
    });
  }
};


module.exports = {
  getAllUsers,
  getOngoingMatches,
  stopMatch,
  getUserById,
  deleteUser,
  suspendUser,
  unsuspendUser,
  getActiveSubscriptions,
  getAllTransactions,
  getTransactionStats
};
