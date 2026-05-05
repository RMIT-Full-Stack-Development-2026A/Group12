const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectToDatabase } = require('./db');
const User = require('../models/user');
const GameRoom = require('../models/gameRoom');
const GameSession = require('../models/gameSession');
const Transaction = require('../models/transaction');
const Wallet = require('../models/wallet');
const Subscription = require('../models/subscription');
const RefreshToken = require('../models/refreshToken');

async function initDB() {
  try {
    await connectToDatabase();

    console.log('Mongoose readyState:', mongoose.connection.readyState);

    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB chua ket noi thanh cong.');
    }

    await Promise.all([
      User.deleteMany({}),
      GameRoom.deleteMany({}),
      GameSession.deleteMany({}),
      Transaction.deleteMany({}),
      Wallet.deleteMany({}),
      Subscription.deleteMany({}),
      RefreshToken.deleteMany({})
    ]);

    const [user1, user2] = await Promise.all([
      User.create({
        username: 'player1',
        email: 'player1@example.com',
        passwordHash: bcrypt.hashSync('TestPass@123', 10),
        country: 'Vietnam'
      }),
      User.create({
        username: 'player2',
        email: 'player2@example.com',
        passwordHash: bcrypt.hashSync('TestPass@123', 10),
        country: 'Vietnam'
      })
    ]);

    await Promise.all([
      Wallet.create({ userId: user1._id, balance: 100000 }),
      Wallet.create({ userId: user2._id, balance: 50000 })
    ]);

    const room = await GameRoom.create({
      roomCode: 'ROOM001',
      hostId: user1._id,
      hostMarker: 'X',
      players: [
        { userId: user1._id, mark: 'X', connected: true },
        { userId: user2._id, mark: 'O', connected: true }
      ],
      boardSize: 10,
      status: 'FINISHED',
      startedAt: new Date(Date.now() - 600000),
      closedAt: new Date()
    });

    await GameSession.create({
      roomId: room._id,
      roomCode: 'ROOM001',
      sessionNumber: 1,
      player1Id: user1._id,
      player2Id: user2._id,
      player1Marker: 'X',
      player2Marker: 'O',
      currentTurn: 'X',
      boardSize: 10,
      gameType: 'ONLINE',
      status: 'WIN',
      winner: 'X',
      result: 'PLAYER1_WIN',
      startTime: new Date(Date.now() - 600000),
      endTime: new Date()
    });

    console.log('Init db mau thanh cong');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

initDB();
