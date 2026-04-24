const cron = require('node-cron');
const Subscription = require('../../models/subscription');
const Wallet = require('../../models/wallet');
const User = require('../../models/user');
const { sendSubscriptionEmail } = require('../../services/email.service');

const PRICE = 10;

function startSubscriptionJob() {
  // Runs every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running subscription cron job...');

    const now = new Date();

    const subs = await Subscription.find();

    for (const sub of subs) {
      const user = await User.findById(sub.userId);
      if (!user) continue;

      const daysLeft = (sub.endDate - now) / (1000 * 60 * 60 * 24);

      // 🔔 Reminder before expiry
      if (daysLeft <= 2 && daysLeft > 0) {
        await sendSubscriptionEmail(
          user.email,
          `Your subscription expires in ${Math.ceil(daysLeft)} day(s)`
        );
      }

      // 🔁 Auto renew
      if (sub.endDate <= now) {
        const wallet = await Wallet.findOne({ userId: user._id });

        if (wallet && wallet.balance >= PRICE) {
          wallet.balance -= PRICE;
          await wallet.save();

          const newEnd = new Date();
          newEnd.setMonth(newEnd.getMonth() + 1);

          sub.startDate = new Date();
          sub.endDate = newEnd;
          await sub.save();

          await sendSubscriptionEmail(
            user.email,
            `Subscription auto-renewed until ${newEnd}`
          );

        } else {
          // ❌ Not enough money → downgrade
          user.isPremium = false;
          await user.save();
        }
      }
    }
  });
}

module.exports = { startSubscriptionJob };