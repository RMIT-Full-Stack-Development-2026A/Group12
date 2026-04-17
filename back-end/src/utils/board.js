const createRoomController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { gameMode, marker, boardSize, aiLevel } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'userId is required'
      });
    }

    const normalizedMarker = String(marker || '').trim();
    const normalizedBoardSize = Number(boardSize);

    if (!['LOCAL', 'SINGLE', 'ONLINE'].includes(gameMode)) {
      return res.status(400).json({
        success: false,
        message: 'gameMode must be LOCAL, SINGLE, or ONLINE'
      });
    }

    if (!ALLOWED_MARKERS.includes(normalizedMarker)) {
      return res.status(400).json({
        success: false,
        message: `Marker must be one of: ${ALLOWED_MARKERS.join(', ')}`
      });
    }

    if (!ALLOWED_BOARD_SIZES.includes(normalizedBoardSize)) {
      return res.status(400).json({
        success: false,
        message: 'Board size must be 3, 10, or 15'
      });
    }

    if (gameMode === 'SINGLE') {
      const session = await GameSession.create({
        player1Id: userId,
        player2Id: null,
        player1Marker: normalizedMarker,
        player2Marker: null,
        aiLevel: aiLevel || 'easy',
        boardSize: normalizedBoardSize,
        gameType: 'SINGLE',
        moves: [],
        result: null,
        startTime: new Date(),
        endTime: null
      });

      return res.status(201).json({
        success: true,
        message: 'Single game created successfully',
        data: session
      });
    }

    if (gameMode === 'LOCAL') {
      const session = await GameSession.create({
        player1Id: userId,
        player2Id: null,
        player1Marker: normalizedMarker,
        player2Marker: null,
        boardSize: normalizedBoardSize,
        gameType: 'LOCAL',
        moves: [],
        result: null,
        startTime: new Date(),
        endTime: null
      });

      return res.status(201).json({
        success: true,
        message: 'Local game created successfully',
        data: session
      });
    }

    const roomCode = await generateUniqueRoomCode();

    const room = await GameRoom.create({
      roomCode,
      players: [
        {
          userId,
          mark: normalizedMarker,
          connected: true
        }
      ],
      boardSize: normalizedBoardSize,
      hostMarker: normalizedMarker,
      currentTurn: normalizedMarker,
      status: 'WAITING',
      chat: [],
      startedAt: null
    });

    const session = await GameSession.create({
      player1Id: userId,
      player2Id: null,
      boardSize: normalizedBoardSize,
      gameType: 'ONLINE',
      moves: [],
      result: null,
      startTime: new Date(),
      endTime: null,
      player1Marker: normalizedMarker,
      player2Marker: null
    });

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        room,
        session,
        shareLink: `${req.protocol}://${req.get('host')}/room/${roomCode}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Create room failed'
    });
  }
};