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

const PlayerPreference = require('./preference.model');

async function findByUserId(userId) {
  return PlayerPreference.findOne({ userId }).exec();
}

async function upsertByUserId(userId, updatePayload) {
  return PlayerPreference.findOneAndUpdate(
    { userId },
    { $set: updatePayload, $setOnInsert: { userId } },
    { returnDocument: 'after', upsert: true }
  ).exec();
}

module.exports = {
  findByUserId,
  upsertByUserId
};
