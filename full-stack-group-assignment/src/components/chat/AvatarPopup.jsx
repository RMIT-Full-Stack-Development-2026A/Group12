import { chatStyles } from './styles'

export default function AvatarPopup({ popup }) {
  if (!popup) return null
  if (popup.type === 'sticker') {
    return <div style={chatStyles.popupSticker}>{popup.content}</div>
  }
  return (
    <div style={chatStyles.popupBubble}>
      <div>{popup.content}</div>
      <div style={chatStyles.popupTail} />
    </div>
  )
}
