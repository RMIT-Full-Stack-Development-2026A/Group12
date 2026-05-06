import { BOARD_SIZES, MARKERS } from '../../constants/gameOptions';

const BOARD_STYLE_OPTIONS = [
  { value: 1, label: 'Classic' },
  { value: 2, label: 'Aurora' },
  { value: 3, label: 'Contrast' },
];

function CreateGamePanel({
  gameMode, setGameMode,
  marker, setMarker,
  boardSize, setBoardSize,
  aiLevel, setAiLevel,
  nextStarterRole, setNextStarterRole,
  localPlayer2Name, setLocalPlayer2Name,
  selectedStyleId, setSelectedStyleId,
  loading,
  onPlay,
  styles,
}) {
  return (
    <form onSubmit={onPlay} style={styles.form}>
      <div style={styles.row}>
        <div style={styles.labelBox}>Game mode :</div>
        <select value={gameMode} onChange={(e) => setGameMode(e.target.value)} style={styles.select}>
          <option value="">Select mode</option>
          <option value="LOCAL">LOCAL</option>
          <option value="SINGLE">SINGLE</option>
          <option value="ONLINE">ONLINE</option>
        </select>
      </div>

      {gameMode === 'LOCAL' && setLocalPlayer2Name ? (
        <div style={styles.row}>
          <div style={styles.labelBox}>Player 2 name :</div>
          <input
            value={localPlayer2Name}
            onChange={(e) => setLocalPlayer2Name(e.target.value)}
            placeholder="Player 2"
            style={{ ...styles.select, outline: 'none' }}
          />
        </div>
      ) : null}

      <div style={styles.row}>
        <div style={styles.labelBox}>Marker :</div>
        <select value={marker} onChange={(e) => setMarker(e.target.value)} style={styles.select}>
          <option value="">Select marker</option>
          {MARKERS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div style={styles.row}>
        <div style={styles.labelBox}>Board size :</div>
        <select value={boardSize} onChange={(e) => setBoardSize(e.target.value)} style={styles.select}>
          <option value="">Select board size</option>
          {BOARD_SIZES.map((size) => (
            <option key={size} value={size}>{size} x {size}</option>
          ))}
        </select>
      </div>

      <div style={styles.row}>
        <div style={styles.labelBox}>Board style :</div>
        <select
          value={selectedStyleId}
          onChange={(e) => setSelectedStyleId && setSelectedStyleId(Number(e.target.value))}
          style={styles.select}
        >
          {BOARD_STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {gameMode === 'SINGLE' && (
        <div style={styles.row}>
          <div style={styles.labelBox}>AI level :</div>
          <select value={aiLevel} onChange={(e) => setAiLevel(e.target.value)} style={styles.select}>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>
      )}

      {gameMode ? (
        <div style={styles.row}>
          <div style={styles.labelBox}>Play at :</div>
          <select value={nextStarterRole} onChange={(e) => setNextStarterRole(e.target.value)} style={styles.select}>
            <option value="PLAYER1">Turn 1</option>
            <option value="PLAYER2">Turn 2</option>
          </select>
        </div>
      ) : null}

      <button type="submit" disabled={loading} style={styles.playButton}>
        {loading ? 'Loading...' : 'Play'}
      </button>
    </form>
  );
}

export default CreateGamePanel;
