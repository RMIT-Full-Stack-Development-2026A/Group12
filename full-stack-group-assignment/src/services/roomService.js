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

async function getJson(url) {
  const response = await fetch(url, {
    method: 'GET',
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
  aiLevel = 'easy',
  player2Marker,
  starterMarker
}) => {
  return postJson(`${ROOMS_URL}/create`, {
    userId,
    gameMode,
    marker,
    boardSize,
    aiLevel,
    player2Marker,
    starterMarker,
  })
}

export const joinRoom = async ({ roomCode, userId, marker }) => {
  return postJson(`${ROOMS_URL}/join/${roomCode}`, {
    userId,
    marker,
  })
}

export const startRoom = async ({ roomCode, userId, starterMarker }) => {
  return postJson(`${ROOMS_URL}/${roomCode}/start`, {
    userId,
    starterMarker,
  })
}

export const getSessionByRoom = async (roomCode) => {
  return getJson(`${ROOMS_URL}/${roomCode}/session`)
}

export const makeMove = async ({ sessionId, row, col, marker }) => {
  return postJson(`${ROOMS_URL}/move`, {
    sessionId,
    row,
    col,
    marker,
  })
}

export const surrenderGame = async ({ sessionId, marker }) => {
  return postJson(`${ROOMS_URL}/surrender`, {
    sessionId,
    marker,
  })
}