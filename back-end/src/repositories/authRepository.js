const User = require('../models/user');

async function findUserByEmail(email) {
  return User.findOne({ email });
}

async function findUserByUsername(username) {
  return User.findOne({ username });
}

async function findUserByLoginIdentifier(normalizedEmail, loginValue) {
  return User.findOne({
    $or: [{ email: normalizedEmail }, { username: loginValue }]
  });
}

async function createUser(payload) {
  return User.create(payload);
}

async function saveUser(user) {
  return user.save();
}

module.exports = {
  findUserByEmail,
  findUserByUsername,
  findUserByLoginIdentifier,
  createUser,
  saveUser
};