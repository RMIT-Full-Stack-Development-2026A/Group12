/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Repository
 * FEATURE  : Edit Profile
 * BRANCH   : feature/edit-profile
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.1.1 / 3.2.1
 * ------------------------------------------------------------
 * OWNED BY THIS BRANCH - Do NOT modify from other branches.
 * To use data from this module, import via exposed interface
 * only. Do NOT import Service layer directly (see A.3.1).
 * ============================================================
 */

/*
 * DEPENDENCY NOTE:
 * This file imports from: ../../models/user.model.js
 * That file is OWNED BY: feature/register branch
 * Expected exports   : User mongoose model
 * If that file does not exist yet, use _stubs/user.model.stub.js.
 */

let User;
if (process.env.NODE_ENV === 'test' || process.env.USE_STUBS === 'true') {
  try {
    User = require('../../models/user.model');
  } catch {
    User = require('../../_stubs/user.model.stub');
    console.warn('[STUB ACTIVE]', __filename);
  }
} else {
  User = require('../../models/user.model');
}

async function findById(userId) {
  return User.findById(userId).exec();
}

async function findByUsername(username) {
  return User.findOne({ username }).exec();
}

async function updateById(userId, updatePayload) {
  return User.findByIdAndUpdate(
    userId,
    { $set: updatePayload },
    { returnDocument: 'after' }
  ).exec();
}

module.exports = {
  findById,
  findByUsername,
  updateById
};
