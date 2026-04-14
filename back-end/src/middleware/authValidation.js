function isNonEmpty(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

function validateRegister(req, res, next) {
  const { username, email, password, country } = req.body;

  if (!isNonEmpty(username) || !isNonEmpty(email) || !isNonEmpty(password) || !isNonEmpty(country)) {
    return res.status(400).json({
      message: 'username, email, password, and country are required'
    });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      message: 'password must be at least 6 characters'
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
