const bcrypt = require('bcryptjs');
const User = require('../models/user');

const MAX_FAILED_LOGINS = 3;
const LOCK_DURATION_MS = 2 * 60 * 1000;

function normalizeEmail(value) {
  return String(value).toLowerCase().trim();
}

function normalizeLoginIdentifier(email, username) {
  return String(email || username).trim();
}

function getSafeUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    country: user.country,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isActive: user.isActive,
    isPremium: user.isPremium,
    walletBalance: user.walletBalance,
    failedLogins: user.failedLogins,
    lockUntil: user.lockUntil,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function register(req, res) {
  try {
    const {
      username,
      email,
      password,
      country,
      avatarUrl,
      isActive,
      isPremium,
      walletBalance
    } = req.body;

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash,
      country,
      avatarUrl,
      role: 'PLAYER',
      isActive,
      isPremium,
      walletBalance,
      failedLogins: 0,
      lockUntil: null
    });

    return res.status(201).json({
      message: 'Register successful',
      user: getSafeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, username, password } = req.body;
    const loginValue = normalizeLoginIdentifier(email, username);
    const normalizedEmail = loginValue.toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: loginValue }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }

    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      return res.status(423).json({
        message: 'Account locked due to 3 failed login attempts',
        lockUntil: user.lockUntil
      });
    }

    if (user.lockUntil && user.lockUntil <= now) {
      user.failedLogins = 0;
      user.lockUntil = null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      user.failedLogins = (user.failedLogins || 0) + 1;

      if (user.failedLogins >= MAX_FAILED_LOGINS) {
        user.failedLogins = 0;
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }

      await user.save();

      if (user.lockUntil) {
        return res.status(423).json({
          message: 'Account locked for 2 minutes after 3 failed attempts',
          lockUntil: user.lockUntil
        });
      }

      return res.status(401).json({
        message: 'Invalid username/email or password',
        failedLogins: user.failedLogins
      });
    }

    user.failedLogins = 0;
    user.lockUntil = null;
    await user.save();

    return res.status(200).json({
      message: 'Login successful',
      user: getSafeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

module.exports = {
  register,
  login
};
