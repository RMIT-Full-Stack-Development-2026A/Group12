import { useMemo, useState } from 'react';
import { createGame, joinRoom } from '../services/roomService';

const MARKERS = ['X', 'O', 'A', 'B', '△', '○'];
const BOARD_SIZES = [3, 10, 15];

function CreateRoomForm({ currentUser }) {
  const [gameMode, setGameMode] = useState('');
  const [marker, setMarker] = useState('');
  const [boardSize, setBoardSize] = useState('');
  const [aiLevel, setAiLevel] = useState('easy');

  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState(null);

  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinMarker, setJoinMarker] = useState('');

  const currentUserId = currentUser?._id || '';
  const currentUsername = currentUser?.username || '';

  const roomCode =
    resultData?.data?.room?.roomCode || resultData?.data?.roomCode || '';

  const roomLink = roomCode
    ? `http://localhost:5173/join-room/${roomCode}`
    : '';

  const isOnlineWaiting = gameMode === 'ONLINE' && !!roomCode;
  const roomData = resultData?.data?.room || resultData?.data;

  const usedMarkers = useMemo(() => {
    const players = resultData?.data?.room?.players || [];
    return players.map((player) => player.mark);
  }, [resultData]);

  const availableJoinMarkers = MARKERS.filter((item) => !usedMarkers.includes(item));

  const handlePlay = async (e) => {
    e.preventDefault();

    if (!currentUserId) {
      setError('Cannot find current user ID. Please login again.');
      return;
    }

    if (!gameMode || !marker || !boardSize) {
      setError('Please select game mode, marker and board size');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResultData(null);

      const data = await createGame({
        userId: currentUserId,
        gameMode,
        marker,
        boardSize: Number(boardSize),
        aiLevel
      });

      setResultData(data);
    } catch (err) {
      setError(err.message || 'Create game failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!roomLink) return;
    await navigator.clipboard.writeText(roomLink);
    alert('Copied room link');
  };

  const handleCopyUserId = async () => {
    if (!currentUserId) return;
    await navigator.clipboard.writeText(currentUserId);
    alert('Copied user ID');
  };

  const handleShare = async () => {
    if (!roomLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Tic Tac Toe room',
          text: 'Join my room',
          url: roomLink
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      await navigator.clipboard.writeText(roomLink);
      alert('Share is not supported. Link copied instead.');
    }
  };
  const extractRoomCode = (value) => {
  const trimmed = value.trim();

  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const parts = trimmed.split('/');
    return parts[parts.length - 1] || '';
  }

  return trimmed;
};

 const handleJoinRoom = async () => {
  if (!currentUserId) {
    setError('Cannot find current user ID. Please login again.');
    return;
  }

  const parsedRoomCode = extractRoomCode(joinRoomCode);

  if (!parsedRoomCode) {
    setError('Please enter a room code or room link');
    return;
  }

  if (!joinMarker) {
    setError('Please select a marker to join');
    return;
  }

  try {
    setJoining(true);
    setError('');

    const data = await joinRoom({
      roomCode: parsedRoomCode,
      userId: currentUserId,
      marker: joinMarker
    });

    alert(data.message || 'Joined room successfully');
  } catch (err) {
    setError(err.message || 'Join room failed');
  } finally {
    setJoining(false);
  }
};

  return (
    <div style={styles.page}>
      {!isOnlineWaiting ? (
        <div style={styles.card}>
          <h2 style={styles.title}>Create New Game</h2>

          <div style={styles.resultBox}>
            <p><strong>Current User</strong></p>
            <p>Username: {currentUsername || 'Unknown'}</p>
            <p>User ID: {currentUserId || 'Not found'}</p>
            <button type="button" onClick={handleCopyUserId} style={styles.copyUserButton}>
              Copy User ID
            </button>
          </div>

          <form onSubmit={handlePlay} style={styles.form}>
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

            <button type="submit" disabled={loading} style={styles.playButton}>
              {loading ? 'Loading...' : 'Play'}
            </button>
          </form>

          {error && <p style={styles.error}>{error}</p>}

          {resultData && gameMode !== 'ONLINE' && (
            <div style={styles.resultBox}>
              <p><strong>{resultData.message}</strong></p>
              <p>Game Mode: {gameMode}</p>
              <p>Board Size: {resultData.data?.boardSize}</p>
              <p>Marker: {marker}</p>
              <p>Session ID: {resultData.data?.session?._id || resultData.data?._id || 'N/A'}</p>
            </div>
          )}

          <div style={styles.resultBox}>
            <p><strong>Join Existing Room</strong></p>

            <div style={styles.joinRow}>
              <input
                type="text"
                placeholder="Enter room code"
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
              onClick={handleJoinRoom}
              disabled={joining}
              style={styles.playButton}
            >
              {joining ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.playerHeader}>
            <div style={styles.playerBox}>
              <span style={styles.playerIcon}>👤</span>
              <span>Player 1</span>
            </div>
            <div style={styles.playerBox}>
              <span>Player 2: Await</span>
              <span style={styles.playerIcon}>👤</span>
            </div>
          </div>

          <div style={styles.resultBox}>
            <p><strong>Current User</strong></p>
            <p>Username: {currentUsername || 'Unknown'}</p>
            <p>User ID: {currentUserId || 'Not found'}</p>
            <button type="button" onClick={handleCopyUserId} style={styles.copyUserButton}>
              Copy User ID
            </button>
          </div>

          <div style={styles.linkRow}>
            <div style={styles.labelBoxSmall}>Link :</div>
            <input value={roomLink} readOnly style={styles.linkInput} />
            <button type="button" onClick={handleCopyLink} style={styles.iconButton}>
              📋
            </button>
          </div>

          <button type="button" onClick={handleShare} style={styles.shareButton}>
            Share
          </button>

          <div style={styles.roomInfo}>
            <p><strong>Room Code:</strong> {roomData?.roomCode}</p>
            <p><strong>Status:</strong> {roomData?.status}</p>
            <p><strong>Current Turn:</strong> {roomData?.currentTurn}</p>
            <p><strong>Board Size:</strong> {roomData?.boardSize}</p>
            <p><strong>Your Marker:</strong> {marker}</p>
            <p><strong>Session ID:</strong> {resultData?.data?.session?._id || 'N/A'}</p>
          </div>

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
              onClick={async () => {
                try {
                  if (!joinMarker) {
                    setError('Please select a marker for user 2');
                    return;
                  }

                  setJoining(true);
                  setError('');

                  const data = await joinRoom({
                    roomCode,
                    userId: currentUserId,
                    marker: joinMarker
                  });

                  alert(data.message || 'Joined room successfully');
                } catch (err) {
                  setError(err.message || 'Join room failed');
                } finally {
                  setJoining(false);
                }
              }}
              disabled={joining}
              style={styles.playButton}
            >
              {joining ? 'Joining...' : 'Join This Room'}
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="button" style={styles.startButton} disabled>
            Start
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '40px 16px'
  },
  card: {
    width: '100%',
    maxWidth: '700px',
    backgroundColor: '#fff',
    border: '2px solid #999',
    borderRadius: '8px',
    padding: '32px 24px',
    boxSizing: 'border-box'
  },
  title: {
    textAlign: 'center',
    marginBottom: '28px',
    fontSize: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '18px'
  },
  row: {
    display: 'flex',
    width: '100%',
    maxWidth: '420px'
  },
  joinRow: {
    display: 'flex',
    width: '100%',
    maxWidth: '420px',
    margin: '10px auto'
  },
  labelBox: {
    width: '140px',
    border: '2px solid #888',
    padding: '10px 12px',
    backgroundColor: '#fff',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  select: {
    flex: 1,
    border: '2px solid #888',
    padding: '10px 12px',
    outline: 'none'
  },
  userIdInput: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #888',
    boxSizing: 'border-box'
  },
  playButton: {
    marginTop: '10px',
    minWidth: '120px',
    padding: '12px 24px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  copyUserButton: {
    marginTop: '10px',
    padding: '8px 12px',
    border: '1px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: '20px'
  },
  resultBox: {
    marginTop: '24px',
    border: '1px solid #ccc',
    padding: '16px',
    textAlign: 'center'
  },
  playerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    borderBottom: '2px solid #ddd',
    paddingBottom: '12px'
  },
  playerBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '600'
  },
  playerIcon: {
    fontSize: '22px'
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    width: '100%',
    maxWidth: '520px',
    margin: '0 auto 20px auto'
  },
  labelBoxSmall: {
    width: '100px',
    border: '2px solid #888',
    padding: '10px 12px',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  linkInput: {
    flex: 1,
    border: '2px solid #888',
    padding: '10px 12px',
    outline: 'none'
  },
  iconButton: {
    marginLeft: '10px',
    padding: '10px 12px',
    border: '2px solid #888',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  shareButton: {
    display: 'block',
    margin: '0 auto 28px auto',
    minWidth: '120px',
    padding: '10px 20px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  roomInfo: {
    textAlign: 'center',
    marginBottom: '28px',
    lineHeight: '1.8'
  },
  startButton: {
    display: 'block',
    margin: '0 auto',
    minWidth: '120px',
    padding: '14px 24px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#f0f0f0',
    cursor: 'not-allowed'
  }
};

export default CreateRoomForm;