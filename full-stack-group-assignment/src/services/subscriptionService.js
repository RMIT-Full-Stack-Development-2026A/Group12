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

export async function getWallet() {
  const res = await fetch(`${API_ROOT_URL}/wallet`, {
    headers: getHeaders()
  })

  return handleResponse(res)
}

export async function depositWallet(amount) {
  const res = await fetch(`${API_ROOT_URL}/payment/vnpay`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount })
  })

  return handleResponse(res)
}

export async function withdrawWallet(amount) {
  const res = await fetch(`${API_ROOT_URL}/wallet/withdraw`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount })
  })

  return handleResponse(res)
}

export async function subscribeWallet() {
  const res = await fetch(`${API_ROOT_URL}/subscription/wallet`, {
    method: 'POST',
    headers: getHeaders()
  })

  return handleResponse(res)
}

export async function subscribeQR() {
  const res = await fetch(`${API_ROOT_URL}/payment/subscribe`, {
    method: 'POST',
    headers: getHeaders()
  })

  return handleResponse(res)
}

export async function getPaymentHistory() {
  const res = await fetch(`${API_ROOT_URL}/transaction/history`, {
    headers: getHeaders()
  })

  return handleResponse(res)
}