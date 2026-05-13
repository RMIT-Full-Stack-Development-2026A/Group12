const cron = require('node-cron');
const Subscription = require('../models/subscription');
const Wallet = require('../models/wallet');
const User = require('../models/user');
const { sendSubscriptionEmail } = require('../services/email.service');

const PRICE = 10;

function startSubscriptionJob() {
  // Runs every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running subscription cron job...');

    const now = new Date();
    const batchSize = 100;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      // Process subscriptions in batches to avoid loading all into memory
      const subs = await Subscription.find()
        .lean()
        .skip(skip)
        .limit(batchSize);

      if (subs.length === 0) {
        hasMore = false;
        break;
      }

      for (const sub of subs) {
        const user = await User.findById(sub.userId).lean();
        if (!user) continue;

        const daysLeft = (sub.endDate - now) / (1000 * 60 * 60 * 24);

        // Reminder before expiry
        if (daysLeft <= 2 && daysLeft > 0) {
          await sendSubscriptionEmail(
            user.email,
            `Your subscription expires in ${Math.ceil(daysLeft)} day(s)`
          );
        }

        // Auto renew
        if (sub.endDate <= now) {
          const wallet = await Wallet.findOne({ userId: user._id });

          if (wallet && wallet.balance >= PRICE) {
            wallet.balance -= PRICE;
            await wallet.save();

            const newEnd = new Date();
            newEnd.setMonth(newEnd.getMonth() + 1);

            await Subscription.findByIdAndUpdate(sub._id, {
              startDate: new Date(),
              endDate: newEnd
            });

            await sendSubscriptionEmail(
              user.email,
              `Subscription auto-renewed until ${newEnd}`
            );

          } else {
            // Not enough money → downgrade
            await User.findByIdAndUpdate(user._id, { isPremium: false });
          }
        }
      }

      skip += batchSize;
    }
  });
}

module.exports = { startSubscriptionJob };