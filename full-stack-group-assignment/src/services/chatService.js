import { apiClient } from './ApiClient'

export function sendChatMessage(sessionId, payload) {
  return apiClient.post(`/rooms/session/${sessionId}/chat`, payload)
}

export function fetchChatHistory(sessionId) {
  return apiClient.get(`/rooms/session/${sessionId}/chat`)
}
