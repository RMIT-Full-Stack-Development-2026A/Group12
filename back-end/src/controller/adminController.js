const User = require('../models/user');
const Subscription = require('../models/subscription');
const Transaction = require('../models/transaction');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Also delete related data
    await Subscription.deleteMany({ userId });
    await Transaction.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

// Suspend user
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User suspended successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message,
    });
  }
};

// Unsuspend user
const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User unsuspended successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unsuspend user',
      error: error.message,
    });
  }
};

// Get all active subscriptions
const getActiveSubscriptions = async (req, res) => {
  try {
    const now = new Date();
    const subscriptions = await Subscription.find({
      isPremium: true,
      endDate: { $gt: now },
    }).populate('userId', 'username email');
    
    res.status(200).json({
      success: true,
      total: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message,
    });
  }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
};

// Get transaction statistics
const getTransactionStats = async (req, res) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction stats',
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
  suspendUser,
  unsuspendUser,
  getActiveSubscriptions,
  getAllTransactions,
  getTransactionStats,
};
