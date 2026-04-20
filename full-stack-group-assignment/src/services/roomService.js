import { API_ROOT_URL } from '../config/appConfig'

const ROOMS_URL = `${API_ROOT_URL}/rooms`

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export const createGame = async ({
  userId,
  gameMode,
  marker,
  boardSize,
  aiLevel = 'easy'
}) => {
  return postJson(`${ROOMS_URL}/create`, {
    userId,
    gameMode,
    marker,
    boardSize,
    aiLevel,
  })
};

export const joinRoom = async ({ roomCode, userId, marker }) => {
  return postJson(`${ROOMS_URL}/join/${roomCode}`, {
    userId,
    marker,
  })
};

export const startRoom = async ({ roomCode, userId }) => {
  return postJson(`${ROOMS_URL}/${roomCode}/start`, {
    userId,
  })
};
export const makeMove = async ({ sessionId, row, col, marker }) => {
  return postJson(`${ROOMS_URL}/move`, {
    sessionId,
    row,
    col,
    marker,
  })
};