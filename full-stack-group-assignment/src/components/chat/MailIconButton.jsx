import { chatStyles } from './styles'

export default function MailIconButton({ isOpen, unreadCount = 0, onClick }) {
  const icon = isOpen ? '📬' : '📪'
  const displayCount = unreadCount > 9 ? '9+' : unreadCount
  return (
    <button
      type="button"
      onClick={onClick}
      style={chatStyles.mailIconButton}
      aria-label={isOpen ? 'Close chat' : `Open chat${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      title={isOpen ? 'Close chat' : 'Open chat'}
    >
      <span>{icon}</span>
      {!isOpen && unreadCount > 0 ? (
        <span style={chatStyles.unreadBadge}>{displayCount}</span>
      ) : null}
    </button>
  )
}
