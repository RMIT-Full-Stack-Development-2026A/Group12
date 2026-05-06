import { MARKERS } from '../../constants/gameOptions';

function JoinRoomPanel({
  joinRoomCode,
  setJoinRoomCode,
  joinMarker,
  setJoinMarker,
  joining,
  onJoinRoom,
  styles,
}) {
  return (
    <div style={styles.resultBox}>
      <p><strong>Join Existing Room</strong></p>

      <div style={styles.joinRow}>
        <input
          type="text"
          placeholder="Enter room code or paste room link"
          value={joinRoomCode}
          onChange={(e) => setJoinRoomCode(e.target.value)}
          style={styles.userIdInput}
        />
      </div>

      <div style={styles.row}>
        <div style={styles.labelBox}>Join marker :</div>
        <select
          value={joinMarker}
          onChange={(e) => setJoinMarker(e.target.value)}
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

      <button
        type="button"
        onClick={() => onJoinRoom()}
        disabled={joining}
        style={styles.playButton}
      >
        {joining ? 'Joining...' : 'Join Room'}
      </button>
    </div>
  );
}

export default JoinRoomPanel;