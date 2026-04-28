const { ALLOWED_MARKERS } = require('../constants/enums');

const validateJoinRoomDto = ({ userId, marker, roomCode }) => {
  const normalizedMarker = String(marker || '').trim();

  if (!userId) {
    return { error: 'userId is required' };
  }

  if (!roomCode) {
    return { error: 'roomCode is required' };
  }

  if (!ALLOWED_MARKERS.includes(normalizedMarker)) {
    return { error: `Marker must be one of: ${ALLOWED_MARKERS.join(', ')}` };
  }

  return {
    value: {
      userId,
      roomCode,
      marker: normalizedMarker
    }
  };
};

module.exports = { validateJoinRoomDto };