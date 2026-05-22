const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const connectToDatabase = require('./config/db');
const authRouter = require('./router/authRouter');
const userProfileRouter = require('./router/userProfileRouter');
const roomRoutes = require('./router/roomRouter');
const walletRoutes = require('./router/wallet.route');
const subscriptionRoutes = require('./router/subscription.route');
const paymentRoutes = require('./router/payment.route');
const transactionRoutes = require('./router/transaction.route');
const adminRoutes = require('./router/adminRouter');
const { startSubscriptionJob } = require('./cron/subscription.cron');
const { startPaymentCleanupJob } = require('./cron/payment.cron');
const { initSocket } = require('./socket');
const gameService = require('./services/game.service');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userProfileRouter);
app.use('/api/rooms', roomRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/admin', adminRoutes);

app.get('/fake-bank', (_, res) => {
  res.send(`
    <html>
      <body style="text-align:center;margin-top:80px;font-family:sans-serif">
        <h1>🏦 Third Party Bank App</h1>

        <script>
          const params = new URLSearchParams(window.location.search);
          const orderId = params.get('orderId');
          const amount = params.get('amount');

          document.write("<p>Transfer to: 123456789</p>");
          document.write("<p>Amount: " + amount + " VND</p>");
          document.write("<p>Content: " + orderId + "</p>");

          function confirmPay() {
            window.location.href =
              "/api/payment/vnpay-return" +
              "?vnp_TxnRef=" + orderId +
              "&vnp_ResponseCode=00&type=qr";
          }
        </script>

        <button onclick="confirmPay()">
          ✅ Confirm Payment
        </button>
      </body>
    </html>
  `);
});

app.get('/wallet', (_, res) => {
  res.send(`
    <html>
      <body style="text-align:center;margin-top:100px;font-family:sans-serif">
        <h1>✅ Payment Successful</h1>
        <p>Your premium subscription is now active.</p>
      </body>
    </html>
  `);
});

function startServer() {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  initSocket(io, {
    onRoomEmpty: gameService.scheduleRoomCleanup,
    onRoomRejoined: gameService.cancelRoomCleanup,
    onSessionEmpty: gameService.scheduleSessionCleanup,
    onSessionRejoined: gameService.cancelSessionCleanup,
  });

  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the process using this port, then restart backend.`);
      process.exit(1);
    }

    console.error('Unable to start HTTP server:', error.message);
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });

  return server;
}

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

async function runRoomCleanup() {
  try {
    const waiting = await gameService.cleanupExpiredWaitingRooms();
    if (waiting?.deletedCount) {
      console.log(`[cleanup] Removed ${waiting.deletedCount} expired waiting room(s)`);
    }
    const dueling = await gameService.cleanupStaleDuelingRooms();
    if (dueling?.closedDuelingRooms) {
      console.log(`[cleanup] Closed ${dueling.closedDuelingRooms} stale dueling room(s)`);
    }
  } catch (e) {
    console.error('[cleanup] Error:', e.message);
  }
}

const server = startServer();

connectToDatabase()
  .then(() => {
    setInterval(runRoomCleanup, CLEANUP_INTERVAL_MS);
    runRoomCleanup();
    startSubscriptionJob();
    startPaymentCleanupJob();
  })
  .catch((error) => {
    console.error('Unable to connect to MongoDB:', error.message);
    console.error('Socket and HTTP server are still running. Fix the database connection to enable room/game features.');
  });
