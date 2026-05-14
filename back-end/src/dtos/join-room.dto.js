const { ALLOWED_MARKERS, MARKER_COLORS } = require('../constants/enums');

const validateJoinRoomDto = ({ userId, marker, roomCode, markerColor }) => {
  const normalizedMarker = String(marker || '').trim();
  const normalizedMarkerColor = String(markerColor || '#000000').trim() || '#000000';

  if (!userId) {
    return { error: 'userId is required' };
  }

  if (!roomCode) {
    return { error: 'roomCode is required' };
  }

  if (!ALLOWED_MARKERS.includes(normalizedMarker)) {
    return { error: `Marker must be one of: ${ALLOWED_MARKERS.join(', ')}` };
  }

  if (normalizedMarkerColor && !MARKER_COLORS.includes(normalizedMarkerColor)) {
    return { error: `markerColor must be one of: ${MARKER_COLORS.join(', ')}` };
  }

  return {
    value: {
      userId,
      roomCode,
      marker: normalizedMarker,
      markerColor: normalizedMarkerColor
    }
  };
};

module.exports = { validateJoinRoomDto };