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

export async function getUserProfile(userId) {
  return requestJson(`${API_ROOT_URL}/users/${userId}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  })
}

export async function updateUserProfile(userId, payload) {
  return requestJson(`${API_ROOT_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })
}
