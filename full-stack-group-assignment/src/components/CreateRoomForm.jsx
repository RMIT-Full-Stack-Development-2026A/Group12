import { useEffect, useState, useRef } from 'react';
import GameBoard from '../components/GameBoard';
import CreateGamePanel from './room/CreateGamePanel';
import JoinRoomPanel from './room/JoinRoomPanel';
import OnlineRoomLobby from './room/OnlineRoomLobby';
import CurrentUserCard from './room/CurrentUserCard';
import useGameDraft from '../hooks/useGameDraft';
import useRoomActions from '../hooks/useRoomActions';
import useRoomSocket from '../hooks/useRoomSocket';
import { getSessionByRoom, getRoom, getSessionById } from '../services/roomService';
import { MARKERS } from '../constants/gameOptions';

function CreateRoomForm({ currentUser, onRequireLogin, onExitToMenu, initialJoinCode, onInitialJoinCodeConsumed, resumeEntry, onResumeEntryConsumed, onGameStatusChange }) {
  const currentUserId = currentUser?._id || '';
  const currentUsername = currentUser?.username || '';
  const [roomClosedMessage, setRoomClosedMessage] = useState('');
  const [adminStopNotification, setAdminStopNotification] = useState(null);
  const [adminStopSeconds, setAdminStopSeconds] = useState(30);
  const adminTimerRef = useRef(null);

  const {
    gameMode, setGameMode,
    marker, setMarker,
    localPlayer2Marker, setLocalPlayer2Marker,
    localPlayer2Name, setLocalPlayer2Name,
    boardSize, setBoardSize,
    aiLevel, setAiLevel,
    nextStarterRole, setNextStarterRole,
    selectedStyleId, setSelectedStyleId,
  } = useGameDraft();

  const {
    loading, joining, starting, replaying, closing,
    error, setError,
    infoMessage, setInfoMessage,
    resultData, setResultData,
    showBoard, setShowBoard,
    joinRoomCode, setJoinRoomCode,
    joinMarker, setJoinMarker,
    joinMarkerColor, setJoinMarkerColor,
    handlePlay,
    handleJoinRoom,
    handleStartRoom,
    handlePlayAgain,
    handleCloseRoom,
    resetToCreateGame,
    backToRoomLobby,
  } = useRoomActions({
    gameMode, setGameMode,
    marker, setMarker,
    boardSize, setBoardSize,
    aiLevel,
    nextStarterRole,
    localPlayer2Marker,
    currentUserId,
    onRequireLogin,
  });

  const roomCode = resultData?.data?.room?.roomCode || resultData?.data?.roomCode || '';
  const roomLink = roomCode ? `${window.location.origin}/join-room/${roomCode}` : '';
  const roomData = resultData?.data?.room || null;
  const sessionData = resultData?.data?.session || null;
  const sessionId = resultData?.data?.session?._id || resultData?.data?._id || '';

  const getPlayerUserId = (player) => {
    if (!player?.userId) return '';
    return typeof player.userId === 'string' ? player.userId : player.userId._id || '';
  };
  const hostUserId = roomData?.hostId
    ? (typeof roomData.hostId === 'string' ? roomData.hostId : roomData.hostId._id || '')
    : getPlayerUserId(roomData?.players?.[0]);

  const isHost = !!hostUserId && String(currentUserId) === String(hostUserId);
  const hasTwoPlayers = (roomData?.players?.length || 0) >= 2;
  const isOnlineWaiting = gameMode === 'ONLINE' && !!roomCode && !!roomData && !showBoard;
  const onlineGuestMarker = roomData?.players?.[1]?.mark || sessionData?.player2Marker || '';
  const isGameOver = ['WIN', 'DRAW', 'FINISHED'].includes(sessionData?.status || '');
  const isHostRoom = !!hostUserId && String(currentUserId) === String(hostUserId);

  useRoomSocket({
    roomCode,
    sessionId,
    isHost,
    setResultData,
    setShowBoard,
    setError,
    setInfoMessage,
    onFetchSession: getSessionByRoom,
    onRoomClosed: (msg) => {
      if (isHostRoom) {
        resetToCreateGame();
        onExitToMenu?.();
        return;
      }

      setRoomClosedMessage(msg || 'This room is closed, return to main menu.');
      setShowBoard(false);
      setError('');
      setInfoMessage('');
    },
    onAdminStop: (payload) => {
      setAdminStopNotification(payload);
      setShowBoard(false);
    },
  });

  useEffect(() => {
    if (initialJoinCode) {
      setJoinRoomCode(initialJoinCode);
      onInitialJoinCodeConsumed?.();
    }
  }, [initialJoinCode]);

  useEffect(() => {
    if (!resumeEntry) return;
    onResumeEntryConsumed?.();

    const { kind, roomCode: rc, sessionId: sid } = resumeEntry;

    if (kind === 'ONLINE' && rc) {
      getRoom(rc)
        .then(async (roomRes) => {
          const room = roomRes?.data || roomRes;
          if (!room) return;

          const myPlayer = (room.players || []).find(
            (p) => String(p.userId?._id || p.userId) === String(currentUser?._id)
          );
          const myMarker = myPlayer?.mark || '';

          let session = null;
          if (room.status === 'PLAYING' && room.currentSessionId) {
            try {
              const sRes = await getSessionByRoom(rc);
              session = sRes?.data || sRes;
            } catch { /* ignore */ }
          }

          setGameMode('ONLINE');
          if (myMarker) setMarker(myMarker);
          setBoardSize(String(room.boardSize || ''));
          setResultData({ data: { room, session } });
          if (session) {
            setShowBoard(true);
          }
        })
        .catch((err) => setError(err.message || 'Failed to rejoin room'));
    }

    if ((kind === 'SINGLE' || kind === 'LOCAL') && sid) {
      getSessionById(sid)
        .then((sessionRes) => {
          const session = sessionRes?.data || sessionRes;
          if (!session) return;

          setGameMode(kind);
          setMarker(session.player1Marker || '');
          setBoardSize(String(session.boardSize || ''));
          setResultData({ data: { session } });
          setShowBoard(true);
        })
        .catch((err) => setError(err.message || 'Failed to rejoin session'));
    }
  }, [resumeEntry]);

  useEffect(() => {
    if (showBoard) {
      setRoomClosedMessage('');
    }
  }, [showBoard]);

  useEffect(() => {
    onGameStatusChange?.(showBoard);
  }, [showBoard, onGameStatusChange]);

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
        await navigator.share({ title: 'Join my Tic Tac Toe room', text: 'Join my room', url: roomLink });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(roomLink);
      alert('Share is not supported. Link copied instead.');
    }
  };

  const handleAdminStopDismiss = () => {
    if (adminTimerRef.current) {
      clearInterval(adminTimerRef.current);
      adminTimerRef.current = null;
    }
    setAdminStopNotification(null);
    setAdminStopSeconds(30);
    resetToCreateGame();
    onExitToMenu?.();
  };

  useEffect(() => {
    if (!adminStopNotification) return;
    // start countdown
    setAdminStopSeconds(30);
    if (adminTimerRef.current) {
      clearInterval(adminTimerRef.current);
    }
    adminTimerRef.current = setInterval(() => {
      setAdminStopSeconds((s) => {
        if (s <= 1) {
          // finalize
          if (adminTimerRef.current) {
            clearInterval(adminTimerRef.current);
            adminTimerRef.current = null;
          }
          handleAdminStopDismiss();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (adminTimerRef.current) {
        clearInterval(adminTimerRef.current);
        adminTimerRef.current = null;
      }
    };
  }, [adminStopNotification]);

  if (adminStopNotification) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.adminStopOverlay}>
            <div style={styles.adminStopModal}>
              <h2 style={styles.adminStopTitle}>Match Stopped</h2>
              <p style={styles.adminStopText}>
                The match was stopped by an administrator.
              </p>
              <div style={styles.adminStopReason}>
                <strong>Reason:</strong>
                <p>{adminStopNotification.reason}</p>
              </div>
              <p style={styles.adminStopAutoRedirect}>
                You will be redirected to home in {adminStopSeconds} second{adminStopSeconds === 1 ? '' : 's'}...
              </p>
              <button
                type="button"
                style={styles.adminStopButton}
                onClick={handleAdminStopDismiss}
              >
                OK, Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roomClosedMessage) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>This room is closed, return to main menu</h2>
            <p style={{ marginBottom: 20, color: '#555' }}>{roomClosedMessage}</p>
            <button type="button" style={styles.playButton} onClick={() => onExitToMenu?.() || resetToCreateGame()}>
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showBoard) {
    const finalBoardSize = roomData?.boardSize || sessionData?.boardSize || Number(boardSize) || 10;
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <GameBoard
            boardSize={finalBoardSize}
            boardStyleId={selectedStyleId}
            gameMode={gameMode}
            marker={marker}
            roomCode={roomCode}
            currentUser={currentUser}
            roomData={roomData}
            resultData={resultData}
            player2Name={localPlayer2Name}
            onBackToCreate={resetToCreateGame}
            onBackToRoom={backToRoomLobby}
            onPlayAgain={() => handlePlayAgain(roomCode)}
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
            nextStarterRole={nextStarterRole}
            setNextStarterRole={setNextStarterRole}
            localPlayer2Name={localPlayer2Name}
            setLocalPlayer2Name={setLocalPlayer2Name}
            selectedStyleId={selectedStyleId}
            setSelectedStyleId={setSelectedStyleId}
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
              {gameMode === 'LOCAL' ? <p>Player 2 Marker: {localPlayer2Marker || 'N/A'}</p> : null}
              <p>Session ID: {resultData.data?._id || 'N/A'}</p>
            </div>
          )}

          <JoinRoomPanel
            joinRoomCode={joinRoomCode}
            setJoinRoomCode={setJoinRoomCode}
            joinMarker={joinMarker}
            setJoinMarker={setJoinMarker}
            joinMarkerColor={joinMarkerColor}
            setJoinMarkerColor={setJoinMarkerColor}
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
          starting={starting}
          closing={closing}
          onJoinRoom={handleJoinRoom}
          onStartRoom={() => handleStartRoom(roomCode, isHost, onlineGuestMarker)}
          onCloseRoom={() => handleCloseRoom(roomCode)}
          onCopyLink={handleCopyLink}
          onShare={handleShare}
          currentUser={currentUser}
          currentUsername={currentUsername}
          currentUserId={currentUserId}
          onCopyUserId={handleCopyUserId}
          selectedStyleId={selectedStyleId}
          setSelectedStyleId={setSelectedStyleId}
          error={error}
          infoMessage={infoMessage}
          nextStarterRole={nextStarterRole}
          setNextStarterRole={setNextStarterRole}
          isGameOver={isGameOver}
          onPlayAgain={() => handlePlayAgain(roomCode)}
          playAgainLoading={replaying}
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
  title: { textAlign: 'center', marginBottom: '28px', fontSize: '20px' },
  form: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
  row: { display: 'flex', width: '100%', maxWidth: '420px', fontSize: '14px', lineHeight: 1.35 },
  joinRow: { display: 'flex', width: '100%', maxWidth: '420px', margin: '10px auto', fontSize: '14px', lineHeight: 1.35 },
  labelBox: { width: '140px', border: '2px solid #888', padding: '10px 12px', backgroundColor: '#fff', textAlign: 'center', boxSizing: 'border-box', fontSize: '14px' },
  select: { flex: 1, border: '2px solid #888', padding: '10px 12px', outline: 'none', fontSize: '14px' },
  userIdInput: { width: '100%', padding: '10px 12px', border: '2px solid #888', boxSizing: 'border-box', fontSize: '14px' },
  playButton: { marginTop: '10px', minWidth: '120px', padding: '12px 24px', border: '2px solid #888', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' },
  copyUserButton: { marginTop: '10px', padding: '8px 12px', border: '1px solid #888', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' },
  error: { color: 'red', textAlign: 'center', marginTop: '20px' },
  info: { color: '#444', textAlign: 'center', marginTop: '20px' },
  resultBox: { marginTop: '24px', border: '1px solid #ccc', padding: '16px', textAlign: 'center', fontSize: '14px', lineHeight: 1.45 },
  playerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '2px solid #ddd', paddingBottom: '12px' },
  playerBox: { display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' },
  playerIcon: { fontSize: '18px' },
  linkRow: { display: 'flex', alignItems: 'center', gap: '0', width: '100%', maxWidth: '520px', margin: '0 auto 20px auto' },
  labelBoxSmall: { width: '100px', border: '2px solid #888', padding: '10px 12px', textAlign: 'center', boxSizing: 'border-box', fontSize: '14px' },
  linkInput: { flex: 1, border: '2px solid #888', padding: '10px 12px', outline: 'none', fontSize: '14px' },
  iconButton: { marginLeft: '10px', padding: '10px 12px', border: '2px solid #888', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' },
  shareButton: { display: 'block', margin: '0 auto 28px auto', minWidth: '120px', padding: '10px 20px', border: '2px solid #888', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' },
  roomInfo: { textAlign: 'center', marginBottom: '28px', lineHeight: '1.55', fontSize: '14px' },
  startButton: { display: 'block', margin: '0 auto', minWidth: '120px', padding: '14px 24px', border: '2px solid #888', borderRadius: '6px', backgroundColor: '#f0f0f0', fontSize: '14px' },
  waitingText: { textAlign: 'center', fontWeight: '600', color: '#555', marginTop: '12px' },
  adminStopOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  },
  adminStopModal: {
    backgroundColor: '#fff',
    border: '3px solid #d84315',
    borderRadius: '8px',
    padding: '32px 24px',
    maxWidth: '500px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  adminStopTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#d84315',
    marginTop: 0,
    marginBottom: '12px',
  },
  adminStopText: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '16px',
  },
  adminStopReason: {
    backgroundColor: '#fff3e0',
    border: '1px solid #ffb74d',
    borderRadius: '6px',
    padding: '12px 16px',
    margin: '16px 0',
    textAlign: 'left',
  },
  adminStopAutoRedirect: {
    fontSize: '13px',
    color: '#666',
    marginTop: '16px',
    marginBottom: '20px',
    fontStyle: 'italic',
  },
  adminStopButton: {
    minWidth: '140px',
    padding: '12px 24px',
    border: '2px solid #d84315',
    borderRadius: '6px',
    backgroundColor: '#d84315',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
};

export default CreateRoomForm;
