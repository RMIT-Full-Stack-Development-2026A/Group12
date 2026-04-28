import { useMemo, useState } from 'react';
import {
  createGame,
  joinRoom,
  startRoom,
  playAgain,
} from '../services/roomService';
import GameBoard from '../components/GameBoard';
import CreateGamePanel from './room/CreateGamePanel';
import JoinRoomPanel from './room/JoinRoomPanel';
import OnlineRoomLobby from './room/OnlineRoomLobby';
import CurrentUserCard from './room/CurrentUserCard';
import useRoomSocket from '../hooks/useRoomSocket';
import { MARKERS } from '../constants/gameOptions';

function CreateRoomForm({ currentUser }) {
  const [gameMode, setGameMode] = useState('');
  const [marker, setMarker] = useState('');
  const [boardSize, setBoardSize] = useState('');
  const [aiLevel, setAiLevel] = useState('easy');

  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [replaying, setReplaying] = useState(false);

  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resultData, setResultData] = useState(null);
  const [showBoard, setShowBoard] = useState(false);

  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinMarker, setJoinMarker] = useState('');

  const currentUserId = currentUser?._id || '';
  const currentUsername = currentUser?.username || '';

  const roomCode =
    resultData?.data?.room?.roomCode || resultData?.data?.roomCode || '';

  const roomLink = roomCode
    ? `${window.location.origin}/join-room/${roomCode}`
    : '';

  const roomData = resultData?.data?.room || null;
  const sessionData = resultData?.data?.session || null;

  const getPlayerUserId = (player) => {
    if (!player?.userId) return '';
    if (typeof player.userId === 'string') return player.userId;
    return player.userId._id || '';
  };

  const hostUserId = roomData?.hostId
    ? typeof roomData.hostId === 'string'
      ? roomData.hostId
      : roomData.hostId._id || ''
    : getPlayerUserId(roomData?.players?.[0]);

  const isHost = !!hostUserId && String(currentUserId) === String(hostUserId);
  const hasTwoPlayers = (roomData?.players?.length || 0) >= 2;

const isOnlineWaiting =
  gameMode === 'ONLINE' &&
  !!roomCode &&
  !!roomData &&
  !showBoard;

  const usedMarkers = useMemo(() => {
    const players = resultData?.data?.room?.players || [];
    return players.map((player) => player.mark);
  }, [resultData]);

  const availableJoinMarkers = MARKERS.filter(
    (item) => !usedMarkers.includes(item)
  );

  useRoomSocket({
    roomCode,
    setResultData,
    setShowBoard,
    setError,
    setInfoMessage,
  });

  const extractRoomCode = (value) => {
    const trimmed = value.trim();

    if (!trimmed) return '';

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parts = trimmed.split('/').filter(Boolean);
      return parts[parts.length - 1] || '';
    }

    return trimmed;
  };

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
      setInfoMessage('');
      setResultData(null);
      setShowBoard(false);

      const data = await createGame({
        userId: currentUserId,
        gameMode,
        marker,
        boardSize: Number(boardSize),
        aiLevel,
      });

      setResultData(data);

      if (gameMode === 'LOCAL' || gameMode === 'SINGLE') {
        setShowBoard(true);
      } else {
        setInfoMessage('Room created. Share the link and wait for player 2.');
      }
    } catch (err) {
      setError(err.message || 'Create game failed');
    } finally {
      setLoading(false);
    }
  };

const handleJoinRoom = async (codeOverride) => {
  if (!currentUserId) {
    setError('Cannot find current user ID. Please login again.');
    return;
  }

  const parsedRoomCode = extractRoomCode(codeOverride || joinRoomCode);

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
    setInfoMessage('');

    const data = await joinRoom({
      roomCode: parsedRoomCode,
      userId: currentUserId,
      marker: joinMarker,
    });

    setResultData((prev) => ({
      ...prev,
      data: {
        ...(prev?.data || {}),
        room: data.data,
        session: null,
      },
    }));

    setMarker(joinMarker);
    setGameMode('ONLINE');
    setBoardSize(String(data.data?.boardSize || ''));
    setShowBoard(false);
    setInfoMessage('Joined room successfully. Waiting for host to start.');
    alert(data.message || 'Joined room successfully');
  } catch (err) {
    setError(err.message || 'Join room failed');
  } finally {
    setJoining(false);
  }
};

  const handleStartRoom = async () => {
    if (!roomCode) {
      setError('Room code not found');
      return;
    }

    if (!isHost) {
      setError('Only host can start the game');
      return;
    }

    try {
      setStarting(true);
      setError('');
      setInfoMessage('');

      const data = await startRoom({
        roomCode,
        userId: currentUserId,
      });

      const nextRoom = data?.data?.room || null;
      const nextSession = data?.data?.session || null;

      setResultData((prev) => ({
        ...prev,
        data: {
          ...(prev?.data || {}),
          room: nextRoom,
          session: nextSession,
        },
      }));

      if (nextSession) {
        setShowBoard(true);
      }

      alert(data.message || 'Game started');
    } catch (err) {
      setError(err.message || 'Start room failed');
    } finally {
      setStarting(false);
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
          url: roomLink,
        });
      } catch (shareError) {
        console.log(shareError);
      }
    } else {
      await navigator.clipboard.writeText(roomLink);
      alert('Share is not supported. Link copied instead.');
    }
  };

  const resetToCreateGame = () => {
    setShowBoard(false);
    setResultData(null);
    setError('');
    setInfoMessage('');
    setJoining(false);
    setStarting(false);
    setReplaying(false);
    setLoading(false);
    setJoinRoomCode('');
    setJoinMarker('');
    setGameMode('');
    setMarker('');
    setBoardSize('');
    setAiLevel('easy');
  };

const handlePlayAgain = async () => {
  if (!currentUserId) {
    resetToCreateGame();
    return;
  }

  if (gameMode !== 'ONLINE' && (!gameMode || !marker || !boardSize)) {
    resetToCreateGame();
    return;
  }

  if (gameMode !== 'ONLINE') {
    try {
      setLoading(true);
      setError('');
      setInfoMessage('');
      setShowBoard(false);

      const data = await createGame({
        userId: currentUserId,
        gameMode,
        marker,
        boardSize: Number(boardSize),
        aiLevel,
      });

      setResultData(data);
      setShowBoard(true);
    } catch (err) {
      setError(err.message || 'Create game failed');
      setShowBoard(false);
    } finally {
      setLoading(false);
    }
    return;
  }

  if (!roomCode) {
    setError('Room code not found');
    return;
  }

  try {
    setReplaying(true);
    setError('');
    setInfoMessage('');

    const data = await playAgain({
      roomCode,
      userId: currentUserId,
    });

    const nextRoom = data?.data?.room || null;
    const nextSession = data?.data?.session || null;
    const waitingForOtherPlayer = data?.data?.waitingForOtherPlayer;

    setResultData((prev) => ({
      ...prev,
      data: {
        ...(prev?.data || {}),
        room: nextRoom || prev?.data?.room || null,
        session: nextSession || prev?.data?.session || null,
      },
    }));

    if (waitingForOtherPlayer) {
      setShowBoard(false);
      setInfoMessage(data.message || 'Waiting for the other player to confirm.');
      return;
    }

    if (nextSession) {
      setBoardSize(String(nextSession.boardSize || nextRoom?.boardSize || boardSize || ''));
      setShowBoard(true);
      setInfoMessage('');
    }
  } catch (err) {
    setError(err.message || 'Play again failed');
  } finally {
    setReplaying(false);
  }
};

  const backToRoomLobby = () => {
  setShowBoard(false);
  setError('');
  setInfoMessage('Game finished. You can play again.');
};


  if (showBoard) {
    const finalBoardSize =
      roomData?.boardSize || sessionData?.boardSize || Number(boardSize) || 10;

    return (
      <div style={styles.page}>
        <div style={styles.card}>
         <GameBoard
  boardSize={finalBoardSize}
  gameMode={gameMode}
  marker={marker}
  roomCode={roomCode}
  currentUser={currentUser}
  roomData={roomData}
  resultData={resultData}
  onBackToCreate={resetToCreateGame}
  onBackToRoom={backToRoomLobby}
  onPlayAgain={handlePlayAgain}
  playAgainLoading={replaying}
/>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {!isOnlineWaiting ? (
        <div style={styles.card}>
          <h2 style={styles.title}>Create New Game</h2>

          <CurrentUserCard
            currentUsername={currentUsername}
            currentUserId={currentUserId}
            onCopyUserId={handleCopyUserId}
            styles={styles}
          />

          <CreateGamePanel
            gameMode={gameMode}
            setGameMode={setGameMode}
            marker={marker}
            setMarker={setMarker}
            boardSize={boardSize}
            setBoardSize={setBoardSize}
            aiLevel={aiLevel}
            setAiLevel={setAiLevel}
            loading={loading}
            onPlay={handlePlay}
            styles={styles}
          />

          {error && <p style={styles.error}>{error}</p>}
          {infoMessage && <p style={styles.info}>{infoMessage}</p>}

          {resultData && gameMode !== 'ONLINE' && (
            <div style={styles.resultBox}>
              <p><strong>{resultData.message}</strong></p>
              <p>Game Mode: {gameMode}</p>
              <p>Board Size: {resultData.data?.boardSize}</p>
              <p>Marker: {marker}</p>
              <p>Session ID: {resultData.data?._id || 'N/A'}</p>
            </div>
          )}

          <JoinRoomPanel
            joinRoomCode={joinRoomCode}
            setJoinRoomCode={setJoinRoomCode}
            joinMarker={joinMarker}
            setJoinMarker={setJoinMarker}
            joining={joining}
            onJoinRoom={handleJoinRoom}
            styles={styles}
          />
        </div>
      ) : (
        <OnlineRoomLobby
          roomData={roomData}
          sessionData={sessionData}
          roomCode={roomCode}
          roomLink={roomLink}
          marker={marker}
          isHost={isHost}
          hasTwoPlayers={hasTwoPlayers}
          joining={joining}
          starting={starting}
          joinMarker={joinMarker}
          setJoinMarker={setJoinMarker}
          availableJoinMarkers={availableJoinMarkers}
          onJoinRoom={handleJoinRoom}
          onStartRoom={handleStartRoom}
          onCopyLink={handleCopyLink}
          onShare={handleShare}
          currentUsername={currentUsername}
          currentUserId={currentUserId}
          onCopyUserId={handleCopyUserId}
          error={error}
          infoMessage={infoMessage}
          styles={styles}
        />
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
    padding: '40px 16px',
  },
  card: {
    width: '100%',
    maxWidth: '700px',
    backgroundColor: '#fff',
    border: '2px solid #999',
    borderRadius: '8px',
    padding: '32px 24px',
    boxSizing: 'border-box',
  },
  title: {
    textAlign: 'center',
    marginBottom: '28px',
    fontSize: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '18px',
  },
  row: {
    display: 'flex',
    width: '100%',
    maxWidth: '420px',
  },
  joinRow: {
    display: 'flex',
    width: '100%',
    maxWidth: '420px',
    margin: '10px auto',
  },
  labelBox: {
    width: '140px',
    border: '2px solid #888',
    padding: '10px 12px',
    backgroundColor: '#fff',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  select: {
    flex: 1,
    border: '2px solid #888',
    padding: '10px 12px',
    outline: 'none',
  },
  userIdInput: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #888',
    boxSizing: 'border-box',
  },
  playButton: {
    marginTop: '10px',
    minWidth: '120px',
    padding: '12px 24px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  copyUserButton: {
    marginTop: '10px',
    padding: '8px 12px',
    border: '1px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: '20px',
  },
  info: {
    color: '#444',
    textAlign: 'center',
    marginTop: '20px',
  },
  resultBox: {
    marginTop: '24px',
    border: '1px solid #ccc',
    padding: '16px',
    textAlign: 'center',
  },
  playerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    borderBottom: '2px solid #ddd',
    paddingBottom: '12px',
  },
  playerBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '600',
  },
  playerIcon: {
    fontSize: '22px',
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    width: '100%',
    maxWidth: '520px',
    margin: '0 auto 20px auto',
  },
  labelBoxSmall: {
    width: '100px',
    border: '2px solid #888',
    padding: '10px 12px',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  linkInput: {
    flex: 1,
    border: '2px solid #888',
    padding: '10px 12px',
    outline: 'none',
  },
  iconButton: {
    marginLeft: '10px',
    padding: '10px 12px',
    border: '2px solid #888',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  shareButton: {
    display: 'block',
    margin: '0 auto 28px auto',
    minWidth: '120px',
    padding: '10px 20px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  roomInfo: {
    textAlign: 'center',
    marginBottom: '28px',
    lineHeight: '1.8',
  },
  startButton: {
    display: 'block',
    margin: '0 auto',
    minWidth: '120px',
    padding: '14px 24px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#f0f0f0',
  },
  waitingText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#555',
    marginTop: '12px',
  },
};

export default CreateRoomForm;