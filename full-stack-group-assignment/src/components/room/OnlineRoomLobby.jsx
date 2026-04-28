function OnlineRoomLobby({
  roomData,
  sessionData,
  roomCode,
  roomLink,
  marker,
  isHost,
  hasTwoPlayers,
  joining,
  starting,
  joinMarker,
  setJoinMarker,
  availableJoinMarkers,
  onJoinRoom,
  onStartRoom,
  onCopyLink,
  onShare,
  currentUsername,
  currentUserId,
  onCopyUserId,
  error,
  infoMessage,
  styles,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.playerHeader}>
        <div style={styles.playerBox}>
          <span style={styles.playerIcon}>👤</span>
          <span>Player 1</span>
        </div>
        <div style={styles.playerBox}>
          <span>{hasTwoPlayers ? 'Player 2 joined' : 'Player 2: Await'}</span>
          <span style={styles.playerIcon}>👤</span>
        </div>
      </div>

      <div style={styles.resultBox}>
        <p><strong>Current User</strong></p>
        <p>Username: {currentUsername || 'Unknown'}</p>
        <p>User ID: {currentUserId || 'Not found'}</p>
        <button type="button" onClick={onCopyUserId} style={styles.copyUserButton}>
          Copy User ID
        </button>
      </div>

      <div style={styles.linkRow}>
        <div style={styles.labelBoxSmall}>Link :</div>
        <input value={roomLink} readOnly style={styles.linkInput} />
        <button type="button" onClick={onCopyLink} style={styles.iconButton}>
          📋
        </button>
      </div>

      <button type="button" onClick={onShare} style={styles.shareButton}>
        Share
      </button>

      <div style={styles.roomInfo}>
        <p><strong>Room Code:</strong> {roomData?.roomCode}</p>
        <p><strong>Status:</strong> {roomData?.status}</p>
        <p><strong>Current Turn:</strong> {sessionData?.currentTurn || 'N/A'}</p>
        <p><strong>Board Size:</strong> {roomData?.boardSize}</p>
        <p><strong>Your Marker:</strong> {marker}</p>
        <p><strong>Session ID:</strong> {sessionData?._id || 'N/A'}</p>
        <p><strong>Role:</strong> {isHost ? 'Host' : 'Guest'}</p>
      </div>

      {!hasTwoPlayers && (
        <div style={styles.resultBox}>
          <p><strong>User 2 Join This Room</strong></p>
          <p>Share the link above or send this room code:</p>
          <p><strong>{roomCode}</strong></p>

          <div style={styles.row}>
            <div style={styles.labelBox}>Join marker :</div>
            <select
              value={joinMarker}
              onChange={(e) => setJoinMarker(e.target.value)}
              style={styles.select}
            >
              <option value="">Select marker</option>
              {availableJoinMarkers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => onJoinRoom(roomCode)}
            disabled={joining}
            style={styles.playButton}
          >
            {joining ? 'Joining...' : 'Join This Room'}
          </button>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}
      {infoMessage && <p style={styles.info}>{infoMessage}</p>}

      {isHost ? (
        <button
          type="button"
          style={{
            ...styles.startButton,
            cursor: hasTwoPlayers ? 'pointer' : 'not-allowed',
            backgroundColor: hasTwoPlayers ? '#fff' : '#f0f0f0',
          }}
          disabled={!hasTwoPlayers || starting}
          onClick={onStartRoom}
        >
          {starting ? 'Starting...' : 'Start'}
        </button>
      ) : (
        <p style={styles.waitingText}>Waiting for host to start</p>
      )}
    </div>
  );
}

export default OnlineRoomLobby;