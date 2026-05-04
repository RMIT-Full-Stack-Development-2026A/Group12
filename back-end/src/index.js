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
const { initSocket } = require('./socket');
const gameService = require('./services/game.service');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

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

function startServer() {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  initSocket(io);

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

connectToDatabase()
  .then(startServer)
  .then(() => {
    setInterval(runRoomCleanup, CLEANUP_INTERVAL_MS);
    runRoomCleanup();
  })
  .catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  });
