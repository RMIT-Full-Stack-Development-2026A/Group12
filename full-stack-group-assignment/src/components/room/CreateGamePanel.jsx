import { BOARD_SIZES, MARKERS } from '../../constants/gameOptions';

function CreateGamePanel({
  gameMode,
  setGameMode,
  marker,
  setMarker,
  boardSize,
  setBoardSize,
  aiLevel,
  setAiLevel,
  nextStarterRole,
  setNextStarterRole,
  loading,
  onPlay,
  styles,
}) {
  return (
    <form onSubmit={onPlay} style={styles.form}>
      <div style={styles.row}>
        <div style={styles.labelBox}>Game mode :</div>
        <select
          value={gameMode}
          onChange={(e) => setGameMode(e.target.value)}
          style={styles.select}
        >
          <option value="">Select mode</option>
          <option value="LOCAL">LOCAL</option>
          <option value="SINGLE">SINGLE</option>
          <option value="ONLINE">ONLINE</option>
        </select>
      </div>

      <div style={styles.row}>
        <div style={styles.labelBox}>Marker :</div>
        <select
          value={marker}
          onChange={(e) => setMarker(e.target.value)}
          style={styles.select}
        >
          <option value="">Select marker</option>
          {MARKERS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.row}>
        <div style={styles.labelBox}>Board size :</div>
        <select
          value={boardSize}
          onChange={(e) => setBoardSize(e.target.value)}
          style={styles.select}
        >
          <option value="">Select board size</option>
          {BOARD_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} x {size}
            </option>
          ))}
        </select>
      </div>

      {gameMode === 'SINGLE' && (
        <div style={styles.row}>
          <div style={styles.labelBox}>AI level :</div>
          <select
            value={aiLevel}
            onChange={(e) => setAiLevel(e.target.value)}
            style={styles.select}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>
      )}

      {gameMode ? (
        <div style={styles.row}>
          <div style={styles.labelBox}>Play at :</div>
          <select
            value={nextStarterRole}
            onChange={(e) => setNextStarterRole(e.target.value)}
            style={styles.select}
          >
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