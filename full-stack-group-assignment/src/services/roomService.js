const API_BASE_URL = 'http://localhost:5000/api/rooms';

export const createGame = async ({
  userId,
  gameMode,
  marker,
  boardSize,
  aiLevel = 'easy'
}) => {
  const response = await fetch(`${API_BASE_URL}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      gameMode,
      marker,
      boardSize,
      aiLevel
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create game');
  }

  return data;
};

export const joinRoom = async ({ roomCode, userId, marker }) => {
  const response = await fetch(`${API_BASE_URL}/join/${roomCode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      marker
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to join room');
  }

  return data;
};

export const startRoom = async ({ roomCode, userId }) => {
  const response = await fetch(`${API_BASE_URL}/${roomCode}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to start room');
  }

  return data;
};
export const makeMove = async ({ sessionId, row, col, marker }) => {
  const response = await fetch(`${API_BASE_URL}/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
      row,
      col,
      marker
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to make move');
  }

  return data;
};