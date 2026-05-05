const { game: gameService } = require('../services');
const { validateCreateRoomDto } = require('../dtos/create-room.dto');
const { validateJoinRoomDto } = require('../dtos/join-room.dto');
const { validateMakeMoveDto } = require('../dtos/make-move.dto');

const createRoomController = async (req, res) => {
  try {
    const { error, value } = validateCreateRoomDto(req.body);

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const result = await gameService.createRoom({ ...value, req });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Create room failed'
    });
  }
};

const joinRoomController = async (req, res) => {
  try {
    const { error, value } = validateJoinRoomDto({
      userId: req.body.userId,
      marker: req.body.marker,
      roomCode: req.params.roomCode
    });

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const result = await gameService.joinRoom(value);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Join room failed'
    });
  }
};

const getRoomController = async (req, res) => {
  try {
    const room = await gameService.getRoom(req.params.roomCode);

    return res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Get room failed'
    });
  }
};

const startRoomController = async (req, res) => {
  try {
    const result = await gameService.startRoom({
      userId: req.body.userId,
      roomCode: req.params.roomCode,
      starterMarker: req.body.starterMarker
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Start game failed'
    });
  }
};

const makeMoveController = async (req, res) => {
  try {
    const { error, value } = validateMakeMoveDto(req.body);

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const result = await gameService.makeMove(value);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Make move failed'
    });
  }
};

const getSessionByRoomController = async (req, res) => {
  try {
    const session = await gameService.getSessionByRoom(req.params.roomCode);

    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Get session failed'
    });
  }
};

const playAgainController = async (req, res) => {
  try {
    const result = await gameService.playAgain({
      userId: req.body.userId,
      roomCode: req.params.roomCode
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Play again failed'
    });
  }
};

const listWaitingRoomsController = async (req, res) => {
  try {
    const rooms = await gameService.listArenaRooms();
    return res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const closeRoomController = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const room = await gameService.closeRoom(roomCode, userId);
    return res.status(200).json({ success: true, message: 'Room closed', data: room });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Close room failed'
    });
  }
};

module.exports = {
  createRoomController,
  joinRoomController,
  getRoomController,
  startRoomController,
  makeMoveController,
  getSessionByRoomController,
  playAgainController,
  listWaitingRoomsController,
  closeRoomController,
};