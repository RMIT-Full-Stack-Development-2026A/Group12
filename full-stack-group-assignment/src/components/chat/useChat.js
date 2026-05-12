import { useCallback, useEffect, useRef, useState } from 'react'
import socket from '../../socket'
import { fetchChatHistory, sendChatMessage } from '../../services/chatService'

const POPUP_DURATION_MS = 5000

/**
 * Hook chứa toàn bộ state + side-effects cho chat.
 *
 * Trong tương lai để hỗ trợ replay (4.3.3): truyền source='replay' và replayMessages
 * — hook sẽ không subscribe socket / không fetch API mà thay vào đó schedule popups
 * theo timeline. Driver level tách rời UI components nên ChatPanel / AvatarPopup
 * reuse trực tiếp được.
 */
export default function useChat({
  sessionId,
  roomCode,
  gameMode,
  currentUserId,
  isOpen,
  source = 'live',
  replayMessages = null,
} = {}) {
  const enabled = gameMode === 'ONLINE' && Boolean(sessionId) && source === 'live'

  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [popups, setPopups] = useState({})
  const [error, setError] = useState('')

  const popupTimersRef = useRef({})
  const isOpenRef = useRef(isOpen)
  const currentUserIdRef = useRef(currentUserId)

  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
  useEffect(() => { currentUserIdRef.current = currentUserId }, [currentUserId])

  // Reset state when session changes
  useEffect(() => {
    setMessages([])
    setUnreadCount(0)
    setPopups({})
    setError('')
    Object.values(popupTimersRef.current).forEach((t) => clearTimeout(t))
    popupTimersRef.current = {}
  }, [sessionId])

  // Clear unread when chat opens
  useEffect(() => {
    if (isOpen) setUnreadCount(0)
  }, [isOpen])

  const triggerPopup = useCallback((senderId, msg) => {
    const key = String(senderId || 'anon')
    setPopups((prev) => ({
      ...prev,
      [key]: { type: msg.type, content: msg.content, ts: Date.now() },
    }))
    if (popupTimersRef.current[key]) {
      clearTimeout(popupTimersRef.current[key])
    }
    popupTimersRef.current[key] = setTimeout(() => {
      setPopups((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      delete popupTimersRef.current[key]
    }, POPUP_DURATION_MS)
  }, [])

  // Load history + subscribe socket
  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    // 1. Load history (no popups for historical messages)
    fetchChatHistory(sessionId)
      .then((res) => {
        if (cancelled) return
        const list = Array.isArray(res?.data?.data) ? res.data.data : []
        setMessages(list)
      })
      .catch(() => {
        // ignore — empty history is fine
      })

    // 2. Subscribe socket
    const handler = (payload) => {
      if (!payload || String(payload.sessionId) !== String(sessionId)) return

      const message = {
        senderId: payload.senderId,
        senderUsername: payload.senderUsername || '',
        type: payload.type,
        content: payload.content,
        timestamp: payload.timestamp || new Date().toISOString(),
      }

      setMessages((prev) => [...prev, message])
      triggerPopup(message.senderId, message)

      if (!isOpenRef.current && String(message.senderId) !== String(currentUserIdRef.current)) {
        setUnreadCount((n) => n + 1)
      }
    }

    socket.on('chat_message', handler)

    return () => {
      cancelled = true
      socket.off('chat_message', handler)
    }
  }, [enabled, sessionId, triggerPopup])

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(popupTimersRef.current).forEach((t) => clearTimeout(t))
      popupTimersRef.current = {}
    }
  }, [])

  // Replay mode: feed pre-recorded messages (placeholder hook for 4.3.3)
  useEffect(() => {
    if (source !== 'replay' || !replayMessages) return
    setMessages(replayMessages)
  }, [source, replayMessages])

  const send = useCallback(
    async (type, content) => {
      if (!enabled) return
      setError('')
      try {
        await sendChatMessage(sessionId, { type, content })
      } catch (err) {
        setError(err?.message || 'Failed to send message')
      }
    },
    [enabled, sessionId]
  )

  const sendText = useCallback((text) => send('text', text), [send])
  const sendSticker = useCallback((sticker) => send('sticker', sticker), [send])

  return {
    enabled,
    messages,
    unreadCount,
    popups,
    error,
    sendText,
    sendSticker,
  }
}
