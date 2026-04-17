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