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

function startServer() {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  initSocket(io);

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
