function mapRegisterPayload(body = {}) {
  return {
    username: body.username,
    email: body.email,
    password: body.password,
    country: body.country,
    avatarUrl: body.avatarUrl,
    isActive: body.isActive,
    isPremium: body.isPremium,
    walletBalance: body.walletBalance
  };
}

function mapLoginPayload(body = {}) {
  return {
    email: body.email,
    username: body.username,
    password: body.password
  };
}

function makeResult(statusCode, body) {
  return {
    statusCode,
    body
  };
}

function mapSafeUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    country: user.country,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isActive: user.isActive,
    isPremium: user.isPremium,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

module.exports = {
  mapRegisterPayload,
  mapLoginPayload,
  makeResult,
  mapSafeUser
};