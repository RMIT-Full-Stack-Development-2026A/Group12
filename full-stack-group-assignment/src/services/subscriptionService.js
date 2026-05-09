import { API_ROOT_URL, TOKEN_STORAGE_KEY } from '../config/appConfig'

function getHeaders() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

export async function getWallet() {
  const res = await fetch(`${API_ROOT_URL}/wallet`, {
    headers: getHeaders()
  })

  return res.json()
}

export async function depositWallet(amount) {
  const res = await fetch(`${API_ROOT_URL}/payment/vnpay`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount })
  })

  return res.json()
}

export async function withdrawWallet(amount) {
  const res = await fetch(`${API_ROOT_URL}/wallet/withdraw`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount })
  })

  return res.json()
}

export async function subscribeWallet() {
  const res = await fetch(`${API_ROOT_URL}/subscription/wallet`, {
    method: 'POST',
    headers: getHeaders()
  })

  return res.json()
}

export async function subscribeQR() {
  const res = await fetch(`${API_ROOT_URL}/payment/subscribe`, {
    method: 'POST',
    headers: getHeaders()
  })

  return res.json()
}

export async function getPaymentHistory() {
  const res = await fetch(`${API_ROOT_URL}/transaction/history`, {
    headers: getHeaders()
  })

  return res.json()
}