const User = require('../../models/user.model');

exports.findUserById = (userId) => {
  return User.findById(userId);
};

exports.updateUser = (user) => {
  return user.save();
};