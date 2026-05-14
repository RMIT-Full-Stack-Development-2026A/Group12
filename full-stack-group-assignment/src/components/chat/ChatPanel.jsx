import { useEffect, useState } from 'react'
import { chatStyles } from './styles'
import ChatHistory from './ChatHistory'
import ChatInputBar from './ChatInputBar'

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < breakpoint
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener(handler)
    }
  }, [breakpoint])
  return isMobile
}

export default function ChatPanel({
  isOpen,
  onClose,
  messages,
  currentUserId,
  onSendText,
  onSendSticker,
  error,
  inputDisabled = false,
}) {
  const isMobile = useIsMobile(900)
  if (!isOpen) return null

  const panelStyle = {
    ...chatStyles.chatPanel,
    ...(isMobile ? chatStyles.chatPanelMobile : {}),
  }

  return (
    <div style={panelStyle} role="region" aria-label="Chat panel">
      <div style={chatStyles.chatHeader}>
        <span>Chat</span>
        <button
          type="button"
          onClick={onClose}
          style={chatStyles.chatClose}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>
      <ChatHistory messages={messages} currentUserId={currentUserId} />
      {error ? <div style={chatStyles.error}>{error}</div> : null}
      <ChatInputBar
        onSendText={onSendText}
        onSendSticker={onSendSticker}
        disabled={inputDisabled}
      />
    </div>
  )
}
