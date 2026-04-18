import mongoose from "mongoose";
import { connectToDatabase } from "./db.js";
import User from "../models/user.js";
import GameRoom from "../models/gameRoom.js";
import GameSession from "../models/gameSession.js";
import Transaction from "../models/transaction.js";
import Wallet from "../models/wallet.js";
import Subscription from "../models/subscription.js";
import RefreshToken from "../models/refreshToken.js";

async function initDB() {
  try {
    await connectToDatabase();

    console.log("Mongoose readyState:", mongoose.connection.readyState);
    // 0 = disconnected
    // 1 = connected
    // 2 = connecting
    // 3 = disconnecting

    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB chua ket noi thanh cong.");
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

    const user1 = await User.create({
      username: "player1",
      email: "player1@example.com",
      passwordHash: "hashed_password_1",
      country: "Vietnam"
    });

    const user2 = await User.create({
      username: "player2",
      email: "player2@example.com",
      passwordHash: "hashed_password_2",
      country: "Vietnam"
    });

    await Wallet.create({ userId: user1._id, balance: 100000 });
    await Wallet.create({ userId: user2._id, balance: 50000 });

    await GameRoom.create({
      roomCode: "ROOM001",
      players: [
        { userId: user1._id, mark: "X", connected: true },
        { userId: user2._id, mark: "O", connected: true }
      ],
      currentTurn: "X",
      status: "PLAYING",
      createdAt: new Date(),
      startedAt: new Date()
    });

    await GameSession.create({
      player1Id: user1._id,
      player2Id: user2._id,
      boardSize: 10,
      gameType: "ONLINE",
      result: "PLAYER1_WIN",
      startTime: new Date(),
      endTime: new Date()
    });

    console.log("Init db mau thanh cong");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

initDB();