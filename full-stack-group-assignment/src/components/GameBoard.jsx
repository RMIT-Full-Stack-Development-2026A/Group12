import { useEffect, useMemo, useRef, useState } from 'react';
import { makeMove, surrenderGame } from '../services/roomService';
import { toAlgebraicNotation, toAssetUrl, computeWinningCells } from '../utils/gameUtils';

const BOARD_STYLE_THEMES = {
  1: { surface: '#ffffff', border: '#7c7c7c', accent: '#4a4a4a', soft: '#f5f5f5' },
  2: { surface: '#eef6ff', border: '#2563eb', accent: '#1d4ed8', soft: '#dbeafe' },
  3: { surface: '#fff7ed', border: '#f97316', accent: '#c2410c', soft: '#ffedd5' },
};

const BOARD_STYLE_LABELS = { 1: 'Classic', 2: 'Aurora', 3: 'Contrast' };

const BOT_NAME_BY_LEVEL = { easy: 'Easy Bot', medium: 'Medium Bot', hard: 'Hard Bot' };

function getStyleId(value) {
  const n = Number(value);
  return [1, 2, 3].includes(n) ? n : 1;
}

function getStyleTheme(value) {
  return BOARD_STYLE_THEMES[getStyleId(value)] || BOARD_STYLE_THEMES[1];
}

function GameBoard({
  boardSize = 10,
  boardStyleId = 1,
  marker = 'X',
  gameMode = 'LOCAL',
  roomCode = '',
  currentUser,
  roomData,
  resultData,
  player2Name = 'Player 2',
  onBackToCreate,
  onPlayAgain,
  onBackToRoom,
  playAgainLoading = false,
  readOnly = false,
}) {
  const [loadingCell, setLoadingCell] = useState(null);
  const [error, setError] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const snapshotRef = useRef(null);
  const [sessionState, setSessionState] = useState(
    resultData?.data?.session || resultData?.data || null
  );

  useEffect(() => {
    setSessionState(resultData?.data?.session || resultData?.data || null);
    setIsAiThinking(false);
  }, [resultData]);

  useEffect(() => {
    if (!isAiThinking) return;
    const timeout = setTimeout(() => {
      setIsAiThinking(false);
      setError('AI move timed out. You can surrender if needed.');
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isAiThinking]);

  const sessionId =
    sessionState?._id ||
    resultData?.data?.session?._id ||
    resultData?.data?._id ||
    '';

  const board = sessionState?.board || [];
  const player1Marker = sessionState?.player1Marker || marker || 'X';
  const player2Marker = sessionState?.player2Marker || roomData?.players?.[1]?.mark || '';
  const currentTurn = sessionState?.currentTurn || marker || 'X';
  const status = sessionState?.status || 'PLAYING';
  const winner = sessionState?.winner || null;
  const aiLevel = sessionState?.aiLevel || resultData?.data?.session?.aiLevel || null;
  const currentStyleId = getStyleId(boardStyleId);
  const currentTheme = getStyleTheme(currentStyleId);

  const username = currentUser?.username || 'Unknown';
  const isFinished = status === 'WIN' || status === 'DRAW' || status === 'FINISHED';
  const isLocalOrSingle = gameMode === 'LOCAL' || gameMode === 'SINGLE';
  const canAct = Boolean(currentTurn) && (!isLocalOrSingle ? currentTurn === marker : true);

  const players = useMemo(() => {
    if (roomData?.players?.length) {
      return roomData.players.map((player, index) => {
        const user = typeof player.userId === 'object' ? player.userId : null;
        return {
          label: `Player ${index + 1}`,
          username: user?.username || `Player ${index + 1}`,
          avatarUrl: toAssetUrl(user?.avatarUrl || ''),
          marker: player.mark,
          styleId: currentStyleId,
          styleLabel: BOARD_STYLE_LABELS[currentStyleId],
        };
      });
    }

    if (gameMode === 'LOCAL') {
      return [
        { label: 'Player 1', username, avatarUrl: toAssetUrl(currentUser?.avatarUrl || ''), marker: player1Marker, styleId: currentStyleId, styleLabel: BOARD_STYLE_LABELS[currentStyleId] },
        { label: 'Player 2', username: player2Name, avatarUrl: '', marker: player2Marker || 'O', styleId: currentStyleId, styleLabel: BOARD_STYLE_LABELS[currentStyleId] },
      ];
    }

    if (gameMode === 'SINGLE') {
      return [
        { label: 'Player 1', username: 'Player 1', avatarUrl: toAssetUrl(currentUser?.avatarUrl || ''), marker: player1Marker, styleId: currentStyleId, styleLabel: BOARD_STYLE_LABELS[currentStyleId] },
        { label: 'Bot', username: BOT_NAME_BY_LEVEL[aiLevel] || 'Bot', avatarUrl: '', marker: player2Marker || 'O', styleId: currentStyleId, styleLabel: BOARD_STYLE_LABELS[currentStyleId] },
      ];
    }

    return [{ label: 'Player', username, avatarUrl: toAssetUrl(currentUser?.avatarUrl || ''), marker, styleId: currentStyleId, styleLabel: BOARD_STYLE_LABELS[currentStyleId] }];
  }, [roomData, gameMode, username, marker, player1Marker, player2Marker, currentStyleId, aiLevel, player2Name, currentUser]);

  const playerNameByMarker = useMemo(() => {
    return players.reduce((map, player) => {
      if (player.marker) map[player.marker] = player.username || player.label || player.marker;
      return map;
    }, {});
  }, [players]);

  const winnerDisplayName = winner ? (playerNameByMarker[winner] || winner) : null;
  const currentTurnDisplayName = currentTurn ? (playerNameByMarker[currentTurn] || currentTurn) : '-';

  const lastMove = sessionState?.moves?.length
    ? sessionState.moves[sessionState.moves.length - 1]
    : null;
  const lastMoveCoordinate = toAlgebraicNotation(lastMove?.position || '');
  const lastMovePlayer = lastMove?.player ? (playerNameByMarker[lastMove.player] || lastMove.player) : '';

  const flatBoard = useMemo(() => {
    if (Array.isArray(board) && board.length > 0) return board.flat();
    return Array.from({ length: boardSize * boardSize }, () => '');
  }, [board, boardSize]);

  const winningCellSet = useMemo(() => {
    if (status !== 'WIN' || !lastMove?.position) return new Set();
    const [r, c] = lastMove.position.split(',').map(Number);
    const target = boardSize === 3 ? 3 : 5;
    return new Set(computeWinningCells(board, r, c, target));
  }, [status, lastMove, board, boardSize]);

  const handleCellClick = async (index) => {
    if (!sessionId || isFinished || isAiThinking) return;
    const activeMarker = gameMode === 'LOCAL' ? currentTurn : marker;
    if (gameMode !== 'LOCAL' && marker !== currentTurn) return;
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    if (board?.[row]?.[col]) return;

    try {
      setLoadingCell(index);
      setError('');
      const data = await makeMove({ sessionId, row, col, marker: activeMarker });
      setSessionState(data.data);
      if (
        data.data?.gameType === 'SINGLE' &&
        data.data?.status === 'PLAYING' &&
        data.data?.currentTurn === data.data?.player2Marker
      ) {
        setIsAiThinking(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to make move');
    } finally {
      setLoadingCell(null);
    }
  };

  const handleSurrender = async () => {
    if (!sessionId || isFinished || isAiThinking) return;
    try {
      setError('');
      setLoadingCell('surrender');
      const data = await surrenderGame({ sessionId, marker: isLocalOrSingle ? currentTurn : marker });
      setSessionState(data.data);
    } catch (err) {
      setError(err.message || 'Failed to surrender');
    } finally {
      setLoadingCell(null);
    }
  };

  const statusText =
    status === 'WIN'
      ? `Winner: ${winnerDisplayName || '-'}`
      : status === 'DRAW'
        ? 'Draw game'
        : `Current turn: ${currentTurnDisplayName}`;

  return (
    <div style={{ ...styles.wrapper, background: currentTheme.soft }}>
      <h2 style={{ ...styles.title, color: currentTheme.accent }}>Game Board</h2>

      {readOnly ? (
        <div style={styles.spectatorBanner}>Spectating — view only</div>
      ) : null}

      {status === 'WIN' && winnerDisplayName ? (
        <div style={styles.winnerBanner}>
          {winnerDisplayName} wins!
        </div>
      ) : null}

      <div style={{ ...styles.infoBox, borderColor: currentTheme.border, background: currentTheme.surface }}>
        <p><strong>Mode:</strong> {gameMode}</p>
        <p><strong>Your marker:</strong> {marker}</p>
        <p><strong>Board size:</strong> {boardSize} x {boardSize}</p>
        <p><strong>Status:</strong> {statusText}</p>
        <p>
          <strong>Last move:</strong>{' '}
          {lastMoveCoordinate
            ? `${lastMovePlayer ? `${lastMovePlayer} -> ` : ''}${lastMoveCoordinate}`
            : 'N/A'}
        </p>
        {roomCode ? <p><strong>Room Code:</strong> {roomCode}</p> : null}
        <p><strong>Session ID:</strong> {sessionId || 'N/A'}</p>
      </div>

      <div style={styles.playersBox}>
        {players.map((player) => (
          <div
            key={`${player.label}-${player.marker}`}
            style={{
              ...styles.playerCard,
              borderColor: getStyleTheme(player.styleId).border,
              background: getStyleTheme(player.styleId).surface,
            }}
          >
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.username}
                style={styles.playerAvatar}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : null}
            <p><strong>{player.label}</strong></p>
            <p>{player.username}</p>
            <p>Marker: {player.marker}</p>
            <p>Style: {player.styleLabel}</p>
          </div>
        ))}
      </div>

      {error ? <p style={styles.error}>{error}</p> : null}

      {isAiThinking && gameMode === 'SINGLE' && (
        <div style={styles.aiThinkingBanner}>
          <span style={styles.aiThinkingDot} /> AI is thinking...
        </div>
      )}

      <div style={{ ...styles.grid, gridTemplateColumns: `repeat(${boardSize}, 40px)` }}>
        {flatBoard.map((cell, index) => {
          const isWinCell = winningCellSet.has(index);
          return (
            <button
              key={index}
              type="button"
              onClick={readOnly ? undefined : () => handleCellClick(index)}
              disabled={
                readOnly ||
                loadingCell === index ||
                isAiThinking ||
                isFinished ||
                (gameMode !== 'LOCAL' && marker !== currentTurn)
              }
              style={{
                ...styles.cell,
                borderColor: isWinCell ? '#f59e0b' : currentTheme.border,
                color: currentTheme.accent,
                backgroundColor: isWinCell ? '#ffe066' : currentTheme.surface,
                fontWeight: isWinCell ? 900 : 'bold',
                border: isWinCell ? '2px solid #f59e0b' : `1px solid ${currentTheme.border}`,
              }}
            >
              {loadingCell === index ? '...' : cell}
            </button>
          );
        })}
      </div>

      {isFinished && (
        <div style={styles.actions}>
          <button type="button" onClick={onPlayAgain} style={styles.actionButton} disabled={playAgainLoading}>
            {playAgainLoading ? 'Waiting...' : 'Play Again'}
          </button>
          {gameMode === 'ONLINE' ? (
            <button type="button" onClick={onBackToRoom} style={styles.actionButton}>Back to Room</button>
          ) : (
            <button type="button" onClick={onBackToCreate} style={styles.actionButton}>Back to Create Game</button>
          )}
        </div>
      )}

      {!isFinished && !readOnly ? (
        <div style={styles.surrenderWrap}>
          <button
            type="button"
            onClick={handleSurrender}
            style={styles.surrenderButton}
            disabled={loadingCell === 'surrender'}
          >
            {loadingCell === 'surrender' ? 'Surrendering...' : 'Surrender'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  wrapper: { padding: 24, textAlign: 'center', fontSize: 14 },
  title: { marginBottom: 18, fontSize: 18 },
  spectatorBanner: {
    background: '#e8f4fd',
    border: '1px solid #2196f3',
    borderRadius: 8,
    padding: '7px 18px',
    fontSize: 13,
    fontWeight: 600,
    color: '#1565c0',
    display: 'inline-block',
    marginBottom: 12,
  },
  winnerBanner: {
    animation: 'winnerPop 0.5s ease forwards',
    background: '#fffbe6',
    border: '2px solid #f59e0b',
    borderRadius: 12,
    padding: '12px 28px',
    fontSize: 20,
    fontWeight: 700,
    color: '#92400e',
    margin: '0 auto 16px',
    display: 'inline-block',
    textAlign: 'center',
  },
  infoBox: {
    marginBottom: 20,
    border: '1px solid #ccc',
    padding: 16,
    borderRadius: 8,
    lineHeight: '1.55',
    fontSize: 14,
  },
  playersBox: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  playerCard: {
    minWidth: 140,
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    lineHeight: 1.45,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
    margin: '0 auto 6px',
    border: '2px solid #ccc',
  },
  error: { color: 'red', marginBottom: 16 },
  grid: { display: 'grid', gap: '4px', justifyContent: 'center', marginTop: '20px' },
  cell: {
    width: '40px',
    height: '40px',
    border: '1px solid #888',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  actions: {
    marginTop: 24,
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  surrenderWrap: { marginTop: 14, display: 'flex', justifyContent: 'center' },
  actionButton: {
    minWidth: '150px',
    padding: '12px 20px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  surrenderButton: {
    minWidth: '180px',
    padding: '12px 20px',
    border: '2px solid #8b1e1e',
    borderRadius: '6px',
    backgroundColor: '#fff0f0',
    color: '#8b1e1e',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700,
  },
  aiThinkingBanner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 auto 12px',
    padding: '6px 16px',
    borderRadius: 20,
    background: '#fffbe6',
    border: '1px solid #f0c040',
    color: '#7a5c00',
    fontSize: 14,
    fontWeight: 600,
  },
  aiThinkingDot: {
    display: 'inline-block',
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: '#f0c040',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
};

export default GameBoard;
