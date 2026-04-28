import { useMemo, useState, useEffect } from 'react';
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

const CREATE_GAME_DRAFT_KEY = 'tictactoe.create-game-draft';

function readDraftValue() {
  try {
    const raw = localStorage.getItem(CREATE_GAME_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function CreateRoomForm({ currentUser, onRequireLogin }) {
  const draft = readDraftValue();

  const [gameMode, setGameMode] = useState(draft?.gameMode || '');
  const [marker, setMarker] = useState(draft?.marker || '');
  const [localPlayer2Marker, setLocalPlayer2Marker] = useState(draft?.localPlayer2Marker || '');
  const [boardSize, setBoardSize] = useState(draft?.boardSize || '');
  const [aiLevel, setAiLevel] = useState(draft?.aiLevel || 'easy');
  const [nextStarterRole, setNextStarterRole] = useState(draft?.nextStarterRole || 'PLAYER1');

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

  useEffect(() => {
    try {
      localStorage.setItem(
        CREATE_GAME_DRAFT_KEY,
        JSON.stringify({
          gameMode,
          marker,
          localPlayer2Marker,
          boardSize,
          aiLevel,
          nextStarterRole
        })
      );
    } catch {
      // Ignore storage failures and keep the form functional.
    }
  }, [gameMode, marker, localPlayer2Marker, boardSize, aiLevel, nextStarterRole]);

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
  const isLocalGame = gameMode === 'LOCAL';
  const isSingleGame = gameMode === 'SINGLE';
  const isOnlineGame = gameMode === 'ONLINE';
  const onlineGuestMarker = roomData?.players?.[1]?.mark || sessionData?.player2Marker || '';
  const starterMarker =
    nextStarterRole === 'PLAYER1'
      ? marker
      : isLocalGame
        ? localPlayer2Marker
        : isSingleGame
          ? sessionData?.player2Marker || MARKERS.find((item) => item !== marker) || ''
          : onlineGuestMarker || marker;

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

  useEffect(() => {
    if (gameMode !== 'LOCAL') {
      setLocalPlayer2Marker('');
      return;
    }

    setLocalPlayer2Marker((prev) => {
      if (prev && prev !== marker) {
        return prev;
      }

      return MARKERS.find((item) => item !== marker) || '';
    });
  }, [gameMode, marker]);

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

    if (gameMode === 'ONLINE' && !currentUserId) {
      setError('You have to login first to play online.');
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }

    if (!gameMode || !marker || !boardSize) {
      setError('Please select game mode, marker and board size');
      return;
    }

    if (isLocalGame && !localPlayer2Marker) {
      setError('Please select marker for Player 2');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setInfoMessage('');
      setResultData(null);
      setShowBoard(false);

      const data = await createGame({
        userId: currentUserId || null,
        gameMode,
        marker,
        boardSize: Number(boardSize),
        aiLevel,
        starterMarker,
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

      const startStarterMarker = nextStarterRole === 'PLAYER1' ? marker : onlineGuestMarker;
      if (!startStarterMarker) {
        setError('Please choose who goes first before starting');
        setStarting(false);
        return;
      }

      const data = await startRoom({
        roomCode,
        userId: currentUserId,
        starterMarker: startStarterMarker,
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

  // const handleJoinRoom = async (codeOverride) => {
  //   if (!currentUserId) {
  //     setError('You have to login first to play online.');
  //     if (onRequireLogin) {
  //       onRequireLogin();
  //     }
  //     return;
  //   }

  //   const parsedRoomCode = extractRoomCode(codeOverride || joinRoomCode);

  //   if (!parsedRoomCode) {
  //     setError('Please enter a room code or room link');
  //     return;
  //   }

  //   if (!joinMarker) {
  //     setError('Please select a marker to join');
  //     return;
  //   }

  //   try {
  //     setJoining(true);
  //     setError('');

  //     const data = await joinRoom({
  //       roomCode: parsedRoomCode,
  //       userId: currentUserId,
  //       marker: joinMarker
  //     });
  //     const sessionRes = await getSessionByRoom(parsedRoomCode);
      
  //     setResultData((prev) => ({
  //       ...prev,
  //       data: {
  //         ...(prev?.data || {}),
  //         room: data.data,
  //         session: sessionRes.data
  //       }
  //     }));
  //     setMarker(joinMarker);
  //     setGameMode('ONLINE');
  //     setShowBoard(false);
  //     alert(data.message || 'Joined room successfully');
  //   } catch (err) {
  //     setError(err.message || 'Join room failed');
  //   } finally {
  //     setJoining(false);
  //   }
  // };

  // const handleStartRoom = async () => {
  //   if (!currentUserId) {
  //     setError('You have to login first to play online.');
  //     if (onRequireLogin) {
  //       onRequireLogin();
  //     }
  //     return;
  //   }

  //   if (!roomCode) {
  //     setError('Room code not found');
  //     return;
  //   }

  //   if (!isHost) {
  //     setError('Only host can start the game');
  //     return;
  //   }

  //   try {
  //     setStarting(true);
  //     setError('');

  //     const startStarterMarker = nextStarterRole === 'PLAYER1' ? marker : onlineGuestMarker;
  //     if (!startStarterMarker) {
  //       setError('Please choose who goes first before starting');
  //       setStarting(false);
  //       return;
  //     }

  //     const data = await startRoom({
  //       roomCode,
  //       userId: currentUserId,
  //       starterMarker: startStarterMarker
  //     });

  //     setResultData((prev) => ({
  //       ...prev,
  //       data: {
  //         ...(prev?.data || {}),
  //         room: data.data
  //       }
  //     }));

  //     setShowBoard(true);
  //     alert(data.message || 'Game started');
  //   } catch (err) {
  //     setError(err.message || 'Start room failed');
  //   } finally {
  //     setStarting(false);
  //   }
  // };
 

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
        starterMarker,
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
            nextStarterRole={nextStarterRole}
            setNextStarterRole={setNextStarterRole}
            loading={loading}
            onPlay={handlePlay}
            styles={styles}
          />

          {/* <div style={styles.resultBox}>
            <p><strong>Current User</strong></p>
            <p>Username: {currentUsername || 'Anonymous'}</p>
            <p>User ID: {currentUserId || 'N/A (Guest mode)'}</p>
            {currentUserId ? (
              <button type="button" onClick={handleCopyUserId} style={styles.copyUserButton}>
                Copy User ID
              </button>
            ) : null}
          </div>

          <form onSubmit={handlePlay} style={styles.form}>
            <div style={styles.row}>
              <div style={styles.labelBox}>Game mode :</div>
              <select
                value={gameMode}
                onChange={(e) => {
                  setGameMode(e.target.value)
                  setError('')
                }}
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
                onChange={(e) => {
                  setMarker(e.target.value)
                  setError('')
                }}
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

            {isLocalGame ? (
              <div style={styles.row}>
                <div style={styles.labelBox}>Player 2 marker :</div>
                <select
                  value={localPlayer2Marker}
                  onChange={(e) => setLocalPlayer2Marker(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select marker</option>
                  {MARKERS.filter((item) => item !== marker).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

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

            {(isLocalGame || isSingleGame || isOnlineGame) ? (
              <div style={styles.row}>
                <div style={styles.labelBox}>First turn :</div>
                <select
                  value={nextStarterRole}
                  onChange={(e) => setNextStarterRole(e.target.value)}
                  style={styles.select}
                >
                  <option value="PLAYER1">
                    {isOnlineGame ? 'Host (Player 1)' : 'Player 1'}
                  </option>
                  <option value="PLAYER2">
                    {isLocalGame ? 'Player 2' : isSingleGame ? 'Bot' : 'Guest (Player 2)'}
                  </option>
                </select>
              </div>
            ) : null}

            <button type="submit" disabled={loading} style={styles.playButton}>
              {loading ? 'Loading...' : 'Play'}
            </button>
          </form> */}


          {error && <p style={styles.error}>{error}</p>}
          {infoMessage && <p style={styles.info}>{infoMessage}</p>}

          {resultData && gameMode !== 'ONLINE' && (
            <div style={styles.resultBox}>
              <p><strong>{resultData.message}</strong></p>
              <p>Game Mode: {gameMode}</p>
              <p>Board Size: {resultData.data?.boardSize}</p>
              <p>Marker: {marker}</p>
              {isLocalGame ? <p>Player 2 Marker: {localPlayer2Marker || 'N/A'}</p> : null}
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
          nextStarterRole={nextStarterRole}
          setNextStarterRole={setNextStarterRole}
          styles={styles}
        />

        // <div style={styles.card}>
        //   <div style={styles.playerHeader}>
        //     <div style={styles.playerBox}>
        //       <span style={styles.playerIcon}>👤</span>
        //       <span>Player 1</span>
        //     </div>
        //     <div style={styles.playerBox}>
        //       <span>
        //         {hasTwoPlayers ? 'Player 2 joined' : 'Player 2: Await'}
        //       </span>
        //       <span style={styles.playerIcon}>👤</span>
        //     </div>
        //   </div>

        //   <div style={styles.resultBox}>
        //     <p><strong>Current User</strong></p>
        //     <p>Username: {currentUsername || 'Unknown'}</p>
        //     <p>User ID: {currentUserId || 'Not found'}</p>
        //     <button type="button" onClick={handleCopyUserId} style={styles.copyUserButton}>
        //       Copy User ID
        //     </button>
        //   </div>

        //   <div style={styles.linkRow}>
        //     <div style={styles.labelBoxSmall}>Link :</div>
        //     <input value={roomLink} readOnly style={styles.linkInput} />
        //     <button type="button" onClick={handleCopyLink} style={styles.iconButton}>
        //       📋
        //     </button>
        //   </div>

        //   <button type="button" onClick={handleShare} style={styles.shareButton}>
        //     Share
        //   </button>

        //   <div style={styles.roomInfo}>
        //     <p><strong>Room Code:</strong> {roomData?.roomCode}</p>
        //     <p><strong>Status:</strong> {roomData?.status}</p>
        //     <p><strong>Current Turn:</strong> {roomData?.currentTurn}</p>
        //     <p><strong>Board Size:</strong> {roomData?.boardSize}</p>
        //     <p><strong>Your Marker:</strong> {marker}</p>
        //     <p><strong>Session ID:</strong> {resultData?.data?.session?._id || 'N/A'}</p>
        //     <p><strong>Role:</strong> {isHost ? 'Host' : 'Guest'}</p>
        //   </div>

        //   {isHost ? (
        //     <div style={styles.row}>
        //       <div style={styles.labelBox}>First turn :</div>
        //       <select
        //         value={nextStarterRole}
        //         onChange={(e) => setNextStarterRole(e.target.value)}
        //         style={styles.select}
        //         disabled={!hasTwoPlayers || starting}
        //       >
        //         <option value="PLAYER1">Host (Player 1)</option>
        //         <option value="PLAYER2">Guest (Player 2)</option>
        //       </select>
        //     </div>
        //   ) : null}

        //   {!hasTwoPlayers && (
        //     <div style={styles.resultBox}>
        //       <p><strong>User 2 Join This Room</strong></p>
        //       <p>Share the link above or send this room code:</p>
        //       <p><strong>{roomCode}</strong></p>

        //       <div style={styles.row}>
        //         <div style={styles.labelBox}>Join marker :</div>
        //         <select
        //           value={joinMarker}
        //           onChange={(e) => setJoinMarker(e.target.value)}
        //           style={styles.select}
        //         >
        //           <option value="">Select marker</option>
        //           {availableJoinMarkers.map((item) => (
        //             <option key={item} value={item}>
        //               {item}
        //             </option>
        //           ))}
        //         </select>
        //       </div>

        //       <button
        //         type="button"
        //         onClick={() => handleJoinRoom(roomCode)}
        //         disabled={joining}
        //         style={styles.playButton}
        //       >
        //         {joining ? 'Joining...' : 'Join This Room'}
        //       </button>
        //     </div>
        //   )}

        //   {error && <p style={styles.error}>{error}</p>}

        //   {isHost ? (
        //     <button
        //       type="button"
        //       style={{
        //         ...styles.startButton,
        //         cursor: hasTwoPlayers ? 'pointer' : 'not-allowed',
        //         backgroundColor: hasTwoPlayers ? '#fff' : '#f0f0f0'
        //       }}
        //       disabled={!hasTwoPlayers || starting}
        //       onClick={handleStartRoom}
        //     >
        //       {starting ? 'Starting...' : 'Start'}
        //     </button>
        //   ) : (
        //     <p style={styles.waitingText}>Waiting for host to start</p>
        //   )}
        // </div>
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
    fontSize: '14px',
    lineHeight: 1.35
  },
  joinRow: {
    display: 'flex',
    width: '100%',
    maxWidth: '420px',
    margin: '10px auto',
    fontSize: '14px',
    lineHeight: 1.35
  },
  labelBox: {
    width: '140px',
    border: '2px solid #888',
    padding: '10px 12px',
    backgroundColor: '#fff',
    textAlign: 'center',
    boxSizing: 'border-box',
    fontSize: '14px'
  },
  select: {
    flex: 1,
    border: '2px solid #888',
    padding: '10px 12px',
    outline: 'none',
    fontSize: '14px'
  },
  userIdInput: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #888',
    boxSizing: 'border-box',
    fontSize: '14px'
  },
  playButton: {
    marginTop: '10px',
    minWidth: '120px',
    padding: '12px 24px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  copyUserButton: {
    marginTop: '10px',
    padding: '8px 12px',
    border: '1px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
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
    fontSize: '14px',
    lineHeight: 1.45
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
    fontSize: '14px'
  },
  playerIcon: {
    fontSize: '18px'
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
    fontSize: '14px'
  },
  linkInput: {
    flex: 1,
    border: '2px solid #888',
    padding: '10px 12px',
    outline: 'none',
    fontSize: '14px'
  },
  iconButton: {
    marginLeft: '10px',
    padding: '10px 12px',
    border: '2px solid #888',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
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
    fontSize: '14px'
  },
  roomInfo: {
    textAlign: 'center',
    marginBottom: '28px',
    lineHeight: '1.8',
    lineHeight: '1.55',
    fontSize: '14px'
  },
  startButton: {
    display: 'block',
    margin: '0 auto',
    minWidth: '120px',
    padding: '14px 24px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#f0f0f0',
    fontSize: '14px'
  },
  waitingText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#555',
    marginTop: '12px',
  },
    fontSize: '14px'
  };

export default CreateRoomForm;