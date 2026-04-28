const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authRepository = require('../repository/authRepository');
const { COUNTRY_LIST } = require('../constants/enums');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwtConfig');
const {
  makeResult,
  mapSafeUser
} = require('../dto/authDto');

const MAX_FAILED_LOGINS = 3;
const LOCK_DURATION_MS = 2 * 60 * 1000;

function normalizeEmail(value) {
  return String(value).toLowerCase().trim();
}

function normalizeLoginIdentifier(email, username) {
  return String(email || username).trim();
}

async function getSafeUser(user) {
  return mapSafeUser(user);
}

async function register(registerRequestDto) {
  const {
    username,
    email,
    password,
    country,
    avatarUrl,
    isActive,
    isPremium,
    walletBalance
  } = registerRequestDto;

  try {
    if (isActive !== undefined || isPremium !== undefined || walletBalance !== undefined) {
      return makeResult(400, {
        message: 'manual set of premium/status/balance is not allowed at signup'
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = String(username).trim();

    const [existingEmail, existingUsername] = await Promise.all([
      authRepository.findUserByEmail(normalizedEmail),
      authRepository.findUserByUsername(normalizedUsername)
    ]);

    if (existingEmail) {
      return makeResult(409, { message: 'Email already exists' });
    }

    if (existingUsername) {
      return makeResult(409, { message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await authRepository.createUser({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      country,
      avatarUrl,
      role: 'PLAYER',
      failedLogins: 0,
      lockUntil: null
    });

    const safeUser = await getSafeUser(user);

    return makeResult(201, {
      message: 'Register successful',
      user: safeUser
    });
  } catch (error) {
    if (error && error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return makeResult(409, { message: 'Email already exists' });
      }

      if (error.keyPattern && error.keyPattern.username) {
        return makeResult(409, { message: 'Username already exists' });
      }
    }

    return makeResult(500, {
      message: 'Registration failed',
      error: error.message
    });
  }
}

async function login(loginRequestDto) {
  const { email, username, password } = loginRequestDto;

  try {
    const loginValue = normalizeLoginIdentifier(email, username);
    const normalizedEmail = loginValue.toLowerCase();

    const user = await authRepository.findUserByLoginIdentifier(normalizedEmail, loginValue);

    if (!user) {
      return makeResult(401, { message: 'Invalid username/email or password' });
    }

    if (user.isActive === false) {
      return makeResult(403, {
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      return makeResult(423, {
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

      await authRepository.saveUser(user);

      if (user.lockUntil) {
        return makeResult(423, {
          message: 'Account locked for 2 minutes after 3 failed attempts',
          lockUntil: user.lockUntil
        });
      }

      return makeResult(401, {
        message: 'Invalid username/email or password',
        failedLogins: user.failedLogins
      });
    }

    user.failedLogins = 0;
    user.lockUntil = null;
    await authRepository.saveUser(user);

    if (!JWT_SECRET) {
      return makeResult(500, {
        message: 'Login failed',
        error: 'JWT secret is not configured'
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const safeUser = await getSafeUser(user);

    return makeResult(200, {
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    return makeResult(500, {
      message: 'Login failed',
      error: error.message
    });
  }
}

function getCountryList() {
  return makeResult(200, { countries: COUNTRY_LIST });
}

module.exports = {
  register,
  login,
  getCountryList
};
