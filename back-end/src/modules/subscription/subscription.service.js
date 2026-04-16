const repo = require('./subscription.repository');

const SUBSCRIPTION_PRICE = 10;

exports.deposit = async (userId, amount) => {
  const user = await repo.findUserById(userId);

  if (!user) throw new Error('User not found');

  user.walletBalance += amount;

  await repo.updateUser(user);

  return user;
};

exports.subscribe = async (userId) => {
  const user = await repo.findUserById(userId);

  if (!user) throw new Error('User not found');

  if (user.walletBalance < SUBSCRIPTION_PRICE) {
    throw new Error('Not enough balance');
  }

  user.walletBalance -= SUBSCRIPTION_PRICE;
  user.isPremium = true;

  await repo.updateUser(user);

  return user;
};