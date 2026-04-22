import { API_ROOT_URL, TOKEN_STORAGE_KEY } from '../config/appConfig'

function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || ''
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function requestJson(url, options) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data.error || data.message || 'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

function unwrapData(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data
  }
  return payload
}

export async function getUserProfile(userId) {
  const payload = await requestJson(`${API_ROOT_URL}/users/${userId}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })

  return unwrapData(payload)
}

export async function updateUserProfile(userId, payload) {
  const result = await requestJson(`${API_ROOT_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })

  return unwrapData(result)
}

export async function uploadUserAvatar(userId, file) {
  const formData = new FormData()
  formData.append('avatar', file)

  const payload = await requestJson(`${API_ROOT_URL}/users/${userId}/avatar`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  })

  return unwrapData(payload)
}

export async function getSessionHistory(userId, query = {}) {
  const searchParams = new URLSearchParams()

  if (query.search) searchParams.set('search', query.search)
  if (query.startDate) searchParams.set('startDate', query.startDate)
  if (query.endDate) searchParams.set('endDate', query.endDate)
  if (query.result) searchParams.set('result', query.result)
  if (query.gameType) searchParams.set('gameType', query.gameType)
  if (query.sortOrder) searchParams.set('sortOrder', query.sortOrder)

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const payload = await requestJson(`${API_ROOT_URL}/users/${userId}/sessions${suffix}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })

  const data = unwrapData(payload)
  return Array.isArray(data) ? data : []
}

export async function deleteSessionHistoryItem(userId, sessionId) {
  return requestJson(`${API_ROOT_URL}/users/${userId}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  })
}
