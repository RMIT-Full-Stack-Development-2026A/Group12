const {
  ALLOWED_MARKERS,
  MARKER_COLORS,
  ALLOWED_BOARD_SIZES,
  ALLOWED_GAME_MODES,
  ALLOWED_AI_LEVELS
} = require('../constants/enums');

const validateCreateRoomDto = (body) => {
  const userId = body.userId || null;
  const gameMode = body.gameMode;
  const marker = String(body.marker || '').trim();
  const boardSize = Number(body.boardSize);
  const aiLevel = body.aiLevel || 'easy';
  const starterMarkerRaw = String(body.starterMarker || '').trim();
  const starterMarker = starterMarkerRaw || null;
  const markerColor = String(body.markerColor || '#000000').trim() || '#000000';

  if (!ALLOWED_GAME_MODES.includes(gameMode)) {
    return { error: 'gameMode must be LOCAL, SINGLE, or ONLINE' };
  }

  if (gameMode === 'ONLINE' && !userId) {
    return { error: 'userId is required for ONLINE mode' };
  }

  if (!ALLOWED_MARKERS.includes(marker)) {
    return { error: `Marker must be one of: ${ALLOWED_MARKERS.join(', ')}` };
  }

  if (!ALLOWED_BOARD_SIZES.includes(boardSize)) {
    return { error: 'Board size must be 3, 10, or 15' };
  }

  if (gameMode === 'SINGLE' && !ALLOWED_AI_LEVELS.includes(aiLevel)) {
    return { error: 'aiLevel must be easy, medium, or hard' };
  }

  if (starterMarker && !ALLOWED_MARKERS.includes(starterMarker)) {
    return { error: `starterMarker must be one of: ${ALLOWED_MARKERS.join(', ')}` };
  }

  if (markerColor && !MARKER_COLORS.includes(markerColor)) {
    return { error: `markerColor must be one of: ${MARKER_COLORS.join(', ')}` };
  }

  return {
    value: {
      userId,
      gameMode,
      marker,
      boardSize,
      aiLevel,
      starterMarker,
      markerColor
    }
  };
};

module.exports = { validateCreateRoomDto };