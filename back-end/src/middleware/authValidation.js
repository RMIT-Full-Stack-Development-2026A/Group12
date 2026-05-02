const { COUNTRY_LIST } = require('../constants/enums');

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

function isNonEmpty(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

function validateRegister(req, res, next) {
  const { username, email, password, country, isActive, isPremium, walletBalance } = req.body;

  if (!isNonEmpty(username) || !isNonEmpty(email) || !isNonEmpty(password) || !isNonEmpty(country)) {
    return res.status(400).json({
      message: 'username, email, password, and country are required'
    });
  }

  if (!USERNAME_REGEX.test(String(username).trim())) {
    return res.status(400).json({
      message: 'username can contain only letters, numbers, underscore, and hyphen'
    });
  }

  if (!COUNTRY_LIST.includes(country)) {
    return res.status(400).json({
      message: 'country must be selected from the allowed country list'
    });
  }

  const PASSWORD_SPECIAL = /[$#@!]/;
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !PASSWORD_SPECIAL.test(password)
  ) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include an uppercase letter, a number, and a special character ($, #, @, !)'
    });
  }

  if (isActive !== undefined || isPremium !== undefined || walletBalance !== undefined) {
    return res.status(400).json({
      message: 'manual set of premium/status/balance is not allowed at signup'
    });
  }

  return next();
}

function validateLogin(req, res, next) {
  const { email, username, password } = req.body;
  const loginIdentifier = email || username;

  if (!isNonEmpty(loginIdentifier) || !isNonEmpty(password)) {
    return res.status(400).json({
      message: 'username/email and password are required'
    });
  }

  return next();
}

module.exports = {
  validateRegister,
  validateLogin
};