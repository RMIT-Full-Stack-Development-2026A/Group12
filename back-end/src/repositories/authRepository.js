const User = require('../models/user');

async function findUserById(userId) {
  return User.findById(userId).exec();
}

async function findUserByEmail(email) {
  return User.findOne({ email }).exec();
}

async function findUserByUsername(username) {
  return User.findOne({ username }).exec();
}

async function findUserByLoginIdentifier(normalizedEmail, loginValue) {
  return User.findOne({
    $or: [{ email: normalizedEmail }, { username: loginValue }]
  }).exec();
}

async function createUser(payload) {
  return User.create(payload);
}

async function saveUser(user) {
  return user.save();
}

module.exports = {
  findUserById,
  findUserByEmail,
  findUserByUsername,
  findUserByLoginIdentifier,
  createUser,
  saveUser
};