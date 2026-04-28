const validateMakeMoveDto = ({ sessionId, row, col, marker }) => {
  if (!sessionId || row === undefined || col === undefined || !marker) {
    return { error: 'sessionId, row, col, and marker are required' };
  }

  return {
    value: {
      sessionId,
      row: Number(row),
      col: Number(col),
      marker: String(marker).trim()
    }
  };
};

module.exports = { validateMakeMoveDto };