import { toAssetUrl } from '../../utils/gameUtils';

const BOARD_STYLE_OPTIONS = [
  { value: '1', label: 'Classic' },
  { value: '2', label: 'Aurora' },
  { value: '3', label: 'Contrast' },
];

function PlayerAvatar({ avatarUrl, username, align = 'left' }) {
  const size = 56;
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      minWidth: 70,
    }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #aaa',
        flexShrink: 0,
      }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span style={{ fontSize: 28 }}>👤</span>
        )}
      </div>
      <span style={{
        fontSize: 12,
        maxWidth: 70,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        color: '#555',
      }}>
        {username || (align === 'left' ? 'Player 1' : 'Player 2')}
      </span>
    </div>
  );
}

function resolvePlayerInfo(playerEntry, fallbackUser) {
  const u = playerEntry?.userId;
  const isPopulated = u && typeof u === 'object' && u.username;
  return {
    username: isPopulated ? u.username : (fallbackUser?.username || null),
    avatarUrl: isPopulated ? toAssetUrl(u.avatarUrl || '') : toAssetUrl(fallbackUser?.avatarUrl || ''),
  };
}

function OnlineRoomLobby({
  roomData,
  sessionData,
  roomCode,
  roomLink,
  marker,
  isHost,
  hasTwoPlayers,
  starting,
  closing,
  onJoinRoom,
  onStartRoom,
  onCloseRoom,
  onCopyLink,
  onShare,
  currentUser,
  currentUsername,
  currentUserId,
  onCopyUserId,
  selectedStyleId,
  setSelectedStyleId,
  error,
  infoMessage,
  nextStarterRole,
  setNextStarterRole,
  isGameOver,
  onPlayAgain,
  playAgainLoading,
  styles,
}) {
  const hostEntry = roomData?.players?.[0];
  const guestEntry = roomData?.players?.[1];

  const hostInfo = resolvePlayerInfo(hostEntry, isHost ? currentUser : null);
  const guestInfo = resolvePlayerInfo(guestEntry, !isHost ? currentUser : null);
  const currentPlayer = roomData?.players?.find((player) => String(player?.userId?._id || player?.userId) === String(currentUserId)) || null;
  const currentMarkerLabel = currentPlayer?.displayMarker || marker;
  const currentMarkerColor = currentPlayer?.markerColor || '#000000';

  return (
    <div style={styles.card}>
      {/* Player header with real avatars */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #eee',
        marginBottom: 12,
      }}>
        <PlayerAvatar
          avatarUrl={hostInfo.avatarUrl}
          username={hostInfo.username}
          align="left"
        />
        <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>
          {hasTwoPlayers ? 'vs' : 'Waiting for Player 2...'}
        </div>
        <PlayerAvatar
          avatarUrl={hasTwoPlayers ? guestInfo.avatarUrl : ''}
          username={hasTwoPlayers ? guestInfo.username : null}
          align="right"
        />
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
        <p><strong>Your Marker:</strong> <span style={{ color: currentMarkerColor, fontWeight: 700 }}>{currentMarkerLabel}</span></p>
        <p><strong>Session ID:</strong> {sessionData?._id || 'N/A'}</p>
        <p><strong>Role:</strong> {isHost ? 'Host' : 'Guest'}</p>
      </div>

      {/* Board style selector */}
      {setSelectedStyleId && (
        <div style={styles.row}>
          <div style={styles.labelBox}>Board style :</div>
          <select
            value={selectedStyleId || '1'}
            onChange={(e) => setSelectedStyleId(e.target.value)}
            style={styles.select}
          >
            {BOARD_STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}
      {infoMessage && <p style={styles.info}>{infoMessage}</p>}

      {isHost ? (
        <div style={styles.row}>
          <div style={styles.labelBox}>Play at :</div>
          <select
            value={nextStarterRole}
            onChange={(e) => setNextStarterRole(e.target.value)}
            style={styles.select}
            disabled={!hasTwoPlayers || starting || playAgainLoading}
          >
            <option value="PLAYER1">Turn 1</option>
            <option value="PLAYER2">Turn 2</option>
          </select>
        </div>
      ) : null}

      {isHost && !isGameOver ? (
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
      ) : isHost && isGameOver ? (
        <>
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginTop: 12,
            flexWrap: 'wrap',
          }}>
            <button
              type="button"
              onClick={onPlayAgain}
              disabled={playAgainLoading}
              style={{
                padding: '10px 24px',
                background: '#f0f9ff',
                color: '#0369a1',
                border: '1px solid #7dd3fc',
                borderRadius: 6,
                cursor: playAgainLoading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {playAgainLoading ? 'Waiting...' : 'Play Again'}
            </button>
            <button
              type="button"
              onClick={onCloseRoom}
              disabled={closing}
              style={{
                padding: '10px 24px',
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                borderRadius: 6,
                cursor: closing ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {closing ? 'Closing...' : 'Close Room'}
            </button>
          </div>
        </>
      ) : (
        <p style={styles.waitingText}>Waiting for host to start</p>
      )}

    </div>
  );
}

export default OnlineRoomLobby;
