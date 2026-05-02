import { apiClient } from './ApiClient';

function unwrapData(res) {
  const payload = res.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
}

export async function getUserProfile(userId) {
  const res = await apiClient.get(`/users/${userId}`);
  return unwrapData(res);
}

export async function updateUserProfile(userId, payload) {
  const res = await apiClient.put(`/users/${userId}`, payload);
  return unwrapData(res);
}

export async function uploadUserAvatar(userId, file) {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await apiClient.patch(`/users/${userId}/avatar`, formData, true);
  return unwrapData(res);
}

export async function getSessionHistory(userId, query = {}) {
  const searchParams = new URLSearchParams();
  ['search', 'startDate', 'endDate', 'result', 'gameType', 'sortOrder'].forEach(k => {
    if (query[k]) searchParams.set(k, query[k]);
  });
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const res = await apiClient.get(`/users/${userId}/sessions${suffix}`);
  const data = unwrapData(res);
  return Array.isArray(data) ? data : [];
}

export async function deleteSessionHistoryItem(userId, sessionId) {
  const res = await apiClient.delete(`/users/${userId}/sessions/${sessionId}`);
  return res.data;
}
