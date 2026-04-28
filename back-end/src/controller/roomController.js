const { getIO } = require('../socket');
const sessionRepo = require('../repositories/gameSession.repository');

const surrenderGameController = async (req, res) => {
  try {
    const { sessionId, marker } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    const session = await sessionRepo.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status === 'WIN' || session.status === 'DRAW' || session.status === 'FINISHED') {
      return res.status(400).json({
        success: false,
        message: 'Game already finished'
      });
    }

    const surrenderMarker = String(marker || session.currentTurn || '').trim();
    const validMarkers = [session.player1Marker, session.player2Marker].filter(Boolean);

    if (!validMarkers.includes(surrenderMarker)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid surrender marker'
      });
    }

    const winnerMarker = surrenderMarker === session.player1Marker ? session.player2Marker : session.player1Marker;

    const updatedSession = await sessionRepo.finishSession(sessionId, {
      status: 'WIN',
      winner: winnerMarker || null,
      result: winnerMarker === session.player1Marker ? 'PLAYER1_WIN' : 'PLAYER2_WIN',
      currentTurn: winnerMarker || session.currentTurn
    });

    if (updatedSession.roomCode) {
      const io = getIO();
      io.to(updatedSession.roomCode).emit('session_updated', updatedSession);
    }

    return res.status(200).json({
      success: true,
      message: 'Game surrendered',
      data: updatedSession
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Surrender failed'
    });
  }
};

module.exports = {
  surrenderGameController
};