import { API_ROOT_URL, TOKEN_STORAGE_KEY } from '../config/appConfig'

function getHeaders() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

// Users endpoints
export async function getAllUsers() {
  const res = await fetch(`${API_ROOT_URL}/admin/users`, {
    headers: getHeaders()
  })

  return res.json()
}

export async function getUserById(userId) {
  const res = await fetch(`${API_ROOT_URL}/admin/users/${userId}`, {
    headers: getHeaders()
  })

  return res.json()
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_ROOT_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })

  return res.json()
}

export async function suspendUser(userId) {
  const res = await fetch(`${API_ROOT_URL}/admin/users/${userId}/suspend`, {
    method: 'PATCH',
    headers: getHeaders()
  })

  return res.json()
}

export async function unsuspendUser(userId) {
  const res = await fetch(`${API_ROOT_URL}/admin/users/${userId}/unsuspend`, {
    method: 'PATCH',
    headers: getHeaders()
  })

  return res.json()
}

// Subscriptions endpoints
export async function getActiveSubscriptions() {
  const res = await fetch(`${API_ROOT_URL}/admin/subscriptions`, {
    headers: getHeaders()
  })

  return res.json()
}

// Transactions endpoints
export async function getAllTransactions() {
  const res = await fetch(`${API_ROOT_URL}/admin/transactions`, {
    headers: getHeaders()
  })

  return res.json()
}

export async function getTransactionStats() {
  const res = await fetch(`${API_ROOT_URL}/admin/transactions/stats`, {
    headers: getHeaders()
  })

  return res.json()
}
