import { useState } from 'react'
import { chatStyles } from './styles'
import StickerPicker from './StickerPicker'

export default function ChatInputBar({ onSendText, onSendSticker, disabled = false }) {
  const [text, setText] = useState('')
  const [stickerOpen, setStickerOpen] = useState(false)

  const submit = (e) => {
    if (e) e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSendText(trimmed)
    setText('')
  }

  const handlePickSticker = (sticker) => {
    if (disabled) return
    onSendSticker(sticker)
    setStickerOpen(false)
  }

  return (
    <div style={chatStyles.inputBar}>
      {stickerOpen ? <StickerPicker onPick={handlePickSticker} /> : null}
      <form style={chatStyles.inputRow} onSubmit={submit}>
        <button
          type="button"
          style={chatStyles.iconButton}
          onClick={() => setStickerOpen((o) => !o)}
          disabled={disabled}
          aria-label="Toggle stickers"
          title="Stickers"
        >
          😀
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? 'Chat unavailable' : 'Type a message...'}
          maxLength={500}
          disabled={disabled}
          style={chatStyles.textInput}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          style={{
            ...chatStyles.sendButton,
            ...((disabled || !text.trim()) ? chatStyles.sendButtonDisabled : {}),
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
