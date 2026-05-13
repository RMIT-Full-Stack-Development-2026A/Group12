import { useState } from 'react';
import { createGame, joinRoom, startRoom, playAgain, closeRoom } from '../services/roomService';
import { DEFAULT_MARKER_COLOR, MARKERS } from '../constants/gameOptions';

function extractRoomCode(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const parts = trimmed.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }
  return trimmed;
}

export default function useRoomActions({
  gameMode, setGameMode,
  marker, setMarker,
  boardSize, setBoardSize,
  aiLevel,
  nextStarterRole,
  localPlayer2Marker,
  currentUserId,
  onRequireLogin,
}) {
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resultData, setResultData] = useState(null);
  const [showBoard, setShowBoard] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinMarker, setJoinMarker] = useState('');
  const [joinMarkerColor, setJoinMarkerColor] = useState(DEFAULT_MARKER_COLOR);

  function getStarterMarker(onlineGuestMarker) {
    if (nextStarterRole === 'PLAYER1') return marker;
    if (gameMode === 'LOCAL') return localPlayer2Marker;
    if (gameMode === 'SINGLE') {
      const session = resultData?.data?.session;
      return session?.player2Marker || MARKERS.find((item) => item !== marker) || '';
    }
    return onlineGuestMarker || marker;
  }

  const handlePlay = async (e) => {
    e?.preventDefault();

    if ((gameMode === 'ONLINE' || gameMode === 'LOCAL') && !currentUserId) {
      setError('You have to login first to play this mode.');
      if (onRequireLogin) onRequireLogin();
      return;
    }

    if (!gameMode || !marker || !boardSize) {
      setError('Please select game mode, marker and board size');
      return;
    }

    if (gameMode === 'LOCAL' && !localPlayer2Marker) {
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
        starterMarker: getStarterMarker(''),
        markerColor: gameMode === 'ONLINE' ? DEFAULT_MARKER_COLOR : undefined,
      });

      setResultData(data);

      if (gameMode === 'LOCAL' || gameMode === 'SINGLE') {
        setShowBoard(true);
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
    if (!parsedRoomCode) { setError('Please enter a room code or room link'); return; }
    if (!joinMarker) { setError('Please select a marker to join'); return; }

    try {
      setJoining(true);
      setError('');
      setInfoMessage('');

      const data = await joinRoom({
        roomCode: parsedRoomCode,
        userId: currentUserId,
        marker: joinMarker,
        markerColor: joinMarkerColor,
      });

      const joinedPlayer = data?.data?.players?.find(
        (player) => String(player?.userId?._id || player?.userId) === String(currentUserId)
      ) || data?.data?.players?.[1] || null;

      setResultData((prev) => ({
        ...prev,
        data: { ...(prev?.data || {}), room: data.data, session: null },
      }));

      setMarker(joinedPlayer?.mark || joinMarker);
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

  const handleStartRoom = async (roomCode, isHost, onlineGuestMarker) => {
    if (!roomCode) { setError('Room code not found'); return; }
    if (!isHost) { setError('Only host can start the game'); return; }

    const startStarterMarker = nextStarterRole === 'PLAYER1' ? marker : onlineGuestMarker;
    if (!startStarterMarker) {
      setError('Please choose who goes first before starting');
      return;
    }

    try {
      setStarting(true);
      setError('');
      setInfoMessage('');

      const data = await startRoom({ roomCode, userId: currentUserId, starterMarker: startStarterMarker });
      const nextRoom = data?.data?.room || null;
      const nextSession = data?.data?.session || null;

      setResultData((prev) => ({
        ...prev,
        data: { ...(prev?.data || {}), room: nextRoom, session: nextSession },
      }));

      if (nextSession) setShowBoard(true);
      alert(data.message || 'Game started');
    } catch (err) {
      setError(err.message || 'Start room failed');
    } finally {
      setStarting(false);
    }
  };

  const handlePlayAgain = async (roomCode) => {
    if (!currentUserId && gameMode === 'ONLINE') { resetToCreateGame(); return; }

    if (gameMode !== 'ONLINE') {
      if (!gameMode || !marker || !boardSize) { resetToCreateGame(); return; }
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
          starterMarker: getStarterMarker(''),
          markerColor: gameMode === 'ONLINE' ? DEFAULT_MARKER_COLOR : undefined,
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

    if (!roomCode) { setError('Room code not found'); return; }

    try {
      setReplaying(true);
      setError('');
      setInfoMessage('');

      const onlineGuestMarker = resultData?.data?.room?.players?.[1]?.mark || marker;
      const playAgainStarterMarker = nextStarterRole === 'PLAYER1' ? marker : onlineGuestMarker;
      const data = await playAgain({ roomCode, userId: currentUserId, starterMarker: playAgainStarterMarker });
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

      // if (waitingForOtherPlayer) {
      //   setShowBoard(false);
      //   setInfoMessage(data.message || 'Waiting for the other player to confirm.');
      //   return;
      // }

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
    setJoinMarkerColor(DEFAULT_MARKER_COLOR);
    setGameMode('');
    setMarker('');
    setBoardSize('');
  };

  const backToRoomLobby = () => {
    setShowBoard(false);
    setError('');
    setInfoMessage('Game finished. You can play again.');
  };

  const handleCloseRoom = async (roomCode) => {
    if (!roomCode || !currentUserId) return;
    try {
      setClosing(true);
      setError('');
      await closeRoom({ roomCode, userId: currentUserId });
      resetToCreateGame();
    } catch (err) {
      setError(err.message || 'Close room failed');
    } finally {
      setClosing(false);
    }
  };

  return {
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
    getStarterMarker,
  };
}
