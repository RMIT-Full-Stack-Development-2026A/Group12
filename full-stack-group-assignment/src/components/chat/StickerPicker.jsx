import { STICKERS } from '../../constants/stickers'
import { chatStyles } from './styles'

export default function StickerPicker({ onPick }) {
  return (
    <div style={chatStyles.stickerGrid}>
      {STICKERS.map((s) => (
        <button
          key={s}
          type="button"
          style={chatStyles.stickerCell}
          onClick={() => onPick(s)}
          aria-label={`Send sticker ${s}`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
