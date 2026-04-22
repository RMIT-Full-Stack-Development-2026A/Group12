import { useEffect, useMemo, useRef, useState } from 'react';
import { makeMove, surrenderGame } from '../services/roomService';

const BOARD_STYLE_THEMES = {
  1: {
    surface: '#ffffff',
    border: '#7c7c7c',
    accent: '#4a4a4a',
    soft: '#f5f5f5'
  },
  2: {
    surface: '#eef6ff',
    border: '#2563eb',
    accent: '#1d4ed8',
    soft: '#dbeafe'
  },
  3: {
    surface: '#fff7ed',
    border: '#f97316',
    accent: '#c2410c',
    soft: '#ffedd5'
  }
};

const BOARD_STYLE_LABELS = {
  1: 'Classic',
  2: 'Aurora',
  3: 'Contrast'
};

const BOT_NAME_BY_LEVEL = {
  easy: 'Easy Bot',
  medium: 'Medium Bot',
  hard: 'Hard Bot'
};

function getStyleId(value) {
  const nextValue = Number(value);
  return [1, 2, 3].includes(nextValue) ? nextValue : 1;
}

function getStyleTheme(value) {
  return BOARD_STYLE_THEMES[getStyleId(value)] || BOARD_STYLE_THEMES[1];
}

function toAlgebraicNotation(position) {
  if (!position || typeof position !== 'string') {
    return '';
  }

  const [rawRow, rawCol] = position.split(',');
  const row = Number(rawRow);
  const col = Number(rawCol);

  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) {
    return '';
  }

  let value = col;
  let column = '';

  do {
    column = String.fromCharCode(65 + (value % 26)) + column;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return `${column}${row + 1}`;
}

function GameBoard({
  boardSize = 10,
  marker = 'X',
  gameMode = 'LOCAL',
  roomCode = '',
  currentUser,
  roomData,
  resultData,
  onBackToCreate,
  onPlayAgain
}) {
  const [loadingCell, setLoadingCell] = useState(null);
  const [error, setError] = useState('');
  const snapshotRef = useRef(null);
  const [sessionState, setSessionState] = useState(
    resultData?.data?.session || resultData?.data || null
  );

  useEffect(() => {
    setSessionState(resultData?.data?.session || resultData?.data || null);
  }, [resultData]);

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
  const currentStyleId = getStyleId(currentUser?.preference?.preferredBoardStyle);
  const currentTheme = getStyleTheme(currentStyleId);

  const username = currentUser?.username || 'Unknown';
  const isFinished = status === 'WIN' || status === 'DRAW' || status === 'FINISHED';
  const isLocalOrSingle = gameMode === 'LOCAL' || gameMode === 'SINGLE';
  const canAct = Boolean(currentTurn) && (!isLocalOrSingle ? currentTurn === marker : true);

  const players = useMemo(() => {
    if (roomData?.players?.length) {
      return roomData.players.map((player, index) => {
        const user = typeof player.userId === 'object' ? player.userId : null;
        const styleId = getStyleId(user?.preference?.preferredBoardStyle || currentStyleId);

        return {
          label: `Player ${index + 1}`,
          username: user?.username || `Player ${index + 1}`,
          marker: player.mark,
          styleId,
          styleLabel: BOARD_STYLE_LABELS[styleId]
        };
      });
    }

    if (gameMode === 'LOCAL') {
      return [
        { label: 'Player 1', username, marker: player1Marker, styleId: currentStyleId, styleLabel: BOARD_STYLE_LABELS[currentStyleId] },
        { label: 'Player 2', username: 'Local Player 2', marker: player2Marker || 'O', styleId: currentStyleId, styleLabel: BOARD_STYLE_LABELS[currentStyleId] }
      ];
    }

    if (gameMode === 'SINGLE') {
      return [
        { label: 'Player 1', username: 'Player 1', marker: player1Marker, styleId: currentStyleId, styleLabel: BOARD_STYLE_LABELS[currentStyleId] },
        {
          label: 'Bot',
          username: BOT_NAME_BY_LEVEL[aiLevel] || 'Bot',
          marker: player2Marker || 'O',
          styleId: currentStyleId,
          styleLabel: BOARD_STYLE_LABELS[currentStyleId]
        }
      ];
    }

    return [{ label: 'Player', username, marker, styleId: currentStyleId, styleLabel: BOARD_STYLE_LABELS[currentStyleId] }];
  }, [roomData, gameMode, username, marker, player1Marker, player2Marker, currentStyleId, aiLevel]);

  const playerNameByMarker = useMemo(() => {
    return players.reduce((map, player) => {
      if (player.marker) {
        map[player.marker] = player.username || player.label || player.marker;
      }
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
    if (Array.isArray(board) && board.length > 0) {
      return board.flat();
    }

    return Array.from({ length: boardSize * boardSize }, () => '');
  }, [board, boardSize]);

  const handleCellClick = async (index) => {
    if (!sessionId || isFinished || !canAct) return;

    const row = Math.floor(index / boardSize);
    const col = index % boardSize;

    if (board?.[row]?.[col]) return;

    const moveMarker = isLocalOrSingle ? currentTurn : marker;
    if (!moveMarker) return;

    const nextBoard = board.map((row) => [...row]);
    nextBoard[row][col] = moveMarker;
    snapshotRef.current = sessionState;

    const optimisticSession = {
      ...(sessionState || {}),
      board: nextBoard,
      currentTurn: currentTurn,
      status: status,
      winner: winner
    };

    setSessionState(optimisticSession);

    try {
      setLoadingCell(index);
      setError('');

      const data = await makeMove({
        sessionId,
        row,
        col,
        marker: moveMarker
      });

      setSessionState(data.data);
    } catch (err) {
      setSessionState(snapshotRef.current || sessionState);
      setError(err.message || 'Failed to make move');
    } finally {
      snapshotRef.current = null;
      setLoadingCell(null);
    }
  };

  const handleSurrender = async () => {
    if (!sessionId || isFinished) return;

    try {
      setError('');
      setLoadingCell('surrender');

      const data = await surrenderGame({
        sessionId,
        marker: isLocalOrSingle ? currentTurn : marker
      });

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
              background: getStyleTheme(player.styleId).surface
            }}
          >
            <p><strong>{player.label}</strong></p>
            <p>{player.username}</p>
            <p>Marker: {player.marker}</p>
            <p>Style: {player.styleLabel}</p>
          </div>
        ))}
      </div>

      {error ? <p style={styles.error}>{error}</p> : null}

      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: `repeat(${boardSize}, 40px)`
        }}
      >
        {flatBoard.map((cell, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleCellClick(index)}
            disabled={loadingCell === index || isFinished || !canAct}
            style={{
              ...styles.cell,
              borderColor: currentTheme.border,
              color: currentTheme.accent,
              backgroundColor: currentTheme.surface
            }}
          >
            {loadingCell === index ? '...' : cell}
          </button>
        ))}
      </div>

      {isFinished && (
        <div style={styles.actions}>
          <button type="button" onClick={onPlayAgain} style={styles.actionButton}>
            Play Again
          </button>
          <button type="button" onClick={onBackToCreate} style={styles.actionButton}>
            Back to Create Game
          </button>
        </div>
      )}

      {!isFinished ? (
        <div style={styles.surrenderWrap}>
          <button type="button" onClick={handleSurrender} style={styles.surrenderButton} disabled={loadingCell === 'surrender'}>
            {loadingCell === 'surrender' ? 'Surrendering...' : 'Surrender'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  wrapper: {
    padding: 24,
    textAlign: 'center',
    fontSize: 14
  },
  title: {
    marginBottom: 18,
    fontSize: 18
  },
  infoBox: {
    marginBottom: 20,
    border: '1px solid #ccc',
    padding: 16,
    borderRadius: 8,
    lineHeight: '1.55',
    fontSize: 14
  },
  playersBox: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 20
  },
  playerCard: {
    minWidth: 140,
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    lineHeight: 1.45
  },
  error: {
    color: 'red',
    marginBottom: 16
  },
  grid: {
    display: 'grid',
    gap: '4px',
    justifyContent: 'center',
    marginTop: '20px'
  },
  cell: {
    width: '40px',
    height: '40px',
    border: '1px solid #888',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  actions: {
    marginTop: 24,
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap'
  },
  surrenderWrap: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'center'
  },
  actionButton: {
    minWidth: '150px',
    padding: '12px 20px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
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
    fontWeight: 700
  }
};

export default GameBoard;