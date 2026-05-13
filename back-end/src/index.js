const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();
const { createProxyMiddleware } = require('http-proxy-middleware');

const connectToDatabase = require('./config/db');
const authRouter = require('./router/authRouter');
const userProfileRouter = require('./router/userProfileRouter');
const roomRoutes = require('./router/roomRouter');
const { initSocket } = require('./socket');
const walletRoutes = require('./router/wallet.route');
const subRoutes = require('./router/subscription.route');
const { startSubscriptionJob } = require('./cron/subscription.cron');
const paymentRoutes = require('./router/payment.route');
const { startPaymentCleanupJob } = require('./cron/payment.cron');
const { game: gameService } = require('./services');
const transactionRoutes = require('./router/transaction.route');
const adminRoutes = require('./router/adminRouter');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173',
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
app.use('/api/subscription', subRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/admin', adminRoutes);

function startServer() {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  initSocket(io, { onAllDisconnected: gameService.closeRoomOnAllDisconnected });

  startSubscriptionJob();

  startPaymentCleanupJob();

  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

connectToDatabase()
  .then(startServer)
  .catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  });

app.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true
  })
);
