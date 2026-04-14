const GameRoom = require('../models/gameRoom');

function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomCode = '';

  for (let i = 0; i < length; i++) {
    roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return roomCode;
}

const createRoom = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required'
      });
    }

    let roomCode;
    let existingRoom;

    do {
      roomCode = generateRoomCode(6);
      existingRoom = await GameRoom.findOne({ roomCode });
    } while (existingRoom);

    const newRoom = await GameRoom.create({
      roomCode,
      players: [
        {
          userId,
          mark: 'X',
          connected: true
        }
      ],
      currentTurn: 'X',
      status: 'WAITING',
      chat: [],
      createdAt: new Date(),
      startedAt: null
    });

    return res.status(201).json({
      message: 'Room created successfully',
      data: newRoom
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create room',
      error: error.message
    });
  }
};

module.exports = {
  createRoom
};