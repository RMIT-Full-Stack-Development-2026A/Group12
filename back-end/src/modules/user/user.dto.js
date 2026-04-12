/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : DTO
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

function mapPreference(user, preference) {
  if (!preference) {
    return null;
  }

  return {
    preferredMarker: preference.preferredMarker,
    preferredBoardStyle: preference.preferredBoardStyle,
    preferredBoardSize: preference.preferredBoardSize,
    isVipStyle: user.isPremium ? Boolean(preference.isVipStyle) : false
  };
}

function toUserProfileDTO(user, preference) {
  return {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    country: user.country,
    avatarUrl: user.avatarUrl || null,
    isPremium: Boolean(user.isPremium),
    role: user.role,
    preference: mapPreference(user, preference)
  };
}

module.exports = {
  toUserProfileDTO
};
