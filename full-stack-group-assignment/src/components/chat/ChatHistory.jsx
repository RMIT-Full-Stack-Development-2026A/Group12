import { useEffect, useRef } from 'react'
import { chatStyles } from './styles'

function formatTime(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return ''
  }
}

export default function ChatHistory({ messages, currentUserId }) {
  const endRef = useRef(null)

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages.length])

  if (!messages.length) {
    return (
      <div style={chatStyles.history}>
        <div style={{ color: '#9ca3af', textAlign: 'center', fontSize: 12, marginTop: 12 }}>
          No messages yet — say hi!
        </div>
        <div ref={endRef} />
      </div>
    )
  }

  return (
    <div style={chatStyles.history}>
      {messages.map((m, idx) => {
        const isMine = String(m.senderId) === String(currentUserId)
        const rowStyle = {
          ...chatStyles.msgRow,
          ...(isMine ? chatStyles.msgRowMine : chatStyles.msgRowOther),
        }
        const bubbleStyle = m.type === 'sticker'
          ? chatStyles.msgSticker
          : { ...chatStyles.msgBubble, ...(isMine ? chatStyles.msgBubbleMine : {}) }
        return (
          <div key={`${m.timestamp}-${idx}`} style={rowStyle}>
            <div style={chatStyles.msgMeta}>
              {isMine ? 'You' : (m.senderUsername || 'Player')} · {formatTime(m.timestamp)}
            </div>
            <div style={bubbleStyle}>{m.content}</div>
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
