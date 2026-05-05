import { apiClient } from './ApiClient';

const ROOMS = '/rooms';

export const createGame = async ({ userId, gameMode, marker, boardSize, aiLevel = 'easy', starterMarker }) => {
  const res = await apiClient.post(`${ROOMS}/create`, { userId, gameMode, marker, boardSize, aiLevel, starterMarker });
  return res.data;
};

export const joinRoom = async ({ roomCode, userId, marker }) => {
  const res = await apiClient.post(`${ROOMS}/join/${roomCode}`, { userId, marker });
  return res.data;
};

export const startRoom = async ({ roomCode, userId, starterMarker }) => {
  const res = await apiClient.post(`${ROOMS}/${roomCode}/start`, { userId, starterMarker });
  return res.data;
};

export const playAgain = async ({ roomCode, userId }) => {
  const res = await apiClient.post(`${ROOMS}/${roomCode}/play-again`, { userId });
  return res.data;
};

export const getSessionByRoom = async (roomCode) => {
  const res = await apiClient.get(`${ROOMS}/${roomCode}/session`);
  return res.data;
};

export const makeMove = async ({ sessionId, row, col, marker }) => {
  const res = await apiClient.post(`${ROOMS}/move`, { sessionId, row, col, marker });
  return res.data;
};

export const surrenderGame = async ({ sessionId, marker }) => {
  const res = await apiClient.post(`${ROOMS}/surrender`, { sessionId, marker });
  return res.data;
};

export const getWaitingRooms = async () => {
  const res = await apiClient.get(`${ROOMS}/arena`);
  return res.data;
};

export const getArenaRooms = async () => {
  const res = await apiClient.get(`${ROOMS}/arena`);
  return res.data;
};

export const getRoom = async (roomCode) => {
  const res = await apiClient.get(`${ROOMS}/${roomCode}`);
  return res.data;
};

export const closeRoom = async ({ roomCode, userId }) => {
  const res = await apiClient.post(`${ROOMS}/${roomCode}/close`, { userId });
  return res.data;
};
