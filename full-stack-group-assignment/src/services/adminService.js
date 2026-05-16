import { API_ROOT_URL, TOKEN_STORAGE_KEY } from '../config/appConfig'

function getHeaders() {
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY)

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function handleResponse(res) {
  const data = await res.json()
  
  if (!res.ok) {
    const error = new Error(data.message || 'Request failed')
    error.status = res.status
    error.data = data
    throw error
  }
  
  return data
}

// Users endpoints
export async function getAllUsers() {
  const res = await fetch(`${API_ROOT_URL}/admin/users`, {
    headers: getHeaders()
  })

  return handleResponse(res)
}

export async function getUserById(userId) {
  const res = await fetch(`${API_ROOT_URL}/admin/users/${userId}`, {
    headers: getHeaders()
  })

  return handleResponse(res)
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_ROOT_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })

  return handleResponse(res)
}

export async function suspendUser(userId) {
  const res = await fetch(`${API_ROOT_URL}/admin/users/${userId}/suspend`, {
    method: 'PATCH',
    headers: getHeaders()
  })

  return handleResponse(res)
}

export async function unsuspendUser(userId) {
  const res = await fetch(`${API_ROOT_URL}/admin/users/${userId}/unsuspend`, {
    method: 'PATCH',
    headers: getHeaders()
  })

  return handleResponse(res)
}

// Subscriptions endpoints
export async function getActiveSubscriptions() {
  const res = await fetch(`${API_ROOT_URL}/admin/subscriptions`, {
    headers: getHeaders()
  })

  return handleResponse(res)
}

// Match endpoints
export async function getOngoingMatches() {
  const res = await fetch(`${API_ROOT_URL}/admin/matches`, {
    headers: getHeaders()
  })

  return handleResponse(res)
}

export async function stopMatch(matchId, reason) {
  const res = await fetch(`${API_ROOT_URL}/admin/matches/${matchId}/stop`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason })
  })

  return handleResponse(res)
}

// Transactions endpoints
export async function getAllTransactions() {
  const res = await fetch(`${API_ROOT_URL}/admin/transactions`, {
    headers: getHeaders()
  })

  return handleResponse(res)
}

export async function getTransactionStats() {
  const res = await fetch(`${API_ROOT_URL}/admin/transactions/stats`, {
    headers: getHeaders()
  })

  return handleResponse(res)
}
