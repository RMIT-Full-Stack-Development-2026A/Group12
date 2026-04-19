const User = require('../../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) throw new Error('Invalid password');

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  return { token, user };
};