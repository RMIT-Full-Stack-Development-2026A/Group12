const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) throw new Error('No token');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};