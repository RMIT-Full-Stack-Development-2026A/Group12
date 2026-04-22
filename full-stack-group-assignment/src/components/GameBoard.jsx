import { useEffect, useMemo, useState } from 'react';
import { makeMove } from '../services/roomService';

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
  const currentTurn = sessionState?.currentTurn || marker || 'X';
  const status = sessionState?.status || 'PLAYING';
  const winner = sessionState?.winner || null;

  const username = currentUser?.username || 'Unknown';
  const isFinished =
    status === 'WIN' || status === 'DRAW' || status === 'FINISHED';

  const players = useMemo(() => {
    if (roomData?.players?.length) {
      return roomData.players.map((player, index) => {
        const user =
          typeof player.userId === 'object' ? player.userId : null;

        return {
          label: `Player ${index + 1}`,
          username: user?.username || `Player ${index + 1}`,
          marker: player.mark
        };
      });
    }

    if (gameMode === 'LOCAL') {
      return [
        { label: 'Player 1', username, marker },
        {
          label: 'Player 2',
          username: 'Local Player 2',
          marker: sessionState?.player2Marker || 'O'
        }
      ];
    }

    if (gameMode === 'SINGLE') {
      return [
        { label: 'Player', username, marker },
        {
          label: 'Bot',
          username: 'AI',
          marker: sessionState?.player2Marker || 'O'
        }
      ];
    }

    return [{ label: 'Player', username, marker }];
  }, [roomData, gameMode, username, marker, sessionState]);

  const flatBoard = useMemo(() => {
    if (Array.isArray(board) && board.length > 0) {
      return board.flat();
    }

    return Array.from({ length: boardSize * boardSize }, () => '');
  }, [board, boardSize]);

  const handleCellClick = async (index) => {
    if (!sessionId || isFinished) return;

    if (marker !== currentTurn) {
      return;
    }

    const row = Math.floor(index / boardSize);
    const col = index % boardSize;

    if (board?.[row]?.[col]) return;

    try {
      setLoadingCell(index);
      setError('');

      const data = await makeMove({
        sessionId,
        row,
        col,
        marker
      });

      setSessionState(data.data);
    } catch (err) {
      setError(err.message || 'Failed to make move');
    } finally {
      setLoadingCell(null);
    }
  };

  const statusText =
    status === 'WIN'
      ? `Winner: ${winner}`
      : status === 'DRAW'
        ? 'Draw game'
        : `Current turn: ${currentTurn}`;

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Game Board</h2>

      <div style={styles.infoBox}>
        <p><strong>Mode:</strong> {gameMode}</p>
        <p><strong>Your marker:</strong> {marker}</p>
        <p><strong>Board size:</strong> {boardSize} x {boardSize}</p>
        <p><strong>Status:</strong> {statusText}</p>
        {roomCode ? <p><strong>Room Code:</strong> {roomCode}</p> : null}
        <p><strong>Session ID:</strong> {sessionId || 'N/A'}</p>
      </div>

      <div style={styles.playersBox}>
        {players.map((player) => (
          <div key={`${player.label}-${player.marker}`} style={styles.playerCard}>
            <p><strong>{player.label}</strong></p>
            <p>{player.username}</p>
            <p>Marker: {player.marker}</p>
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
            disabled={loadingCell === index || isFinished || marker !== currentTurn}
            style={styles.cell}
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
    </div>
  );
}

const styles = {
  wrapper: {
    padding: 24,
    textAlign: 'center'
  },
  title: {
    marginBottom: 20
  },
  infoBox: {
    marginBottom: 20,
    border: '1px solid #ccc',
    padding: 16,
    borderRadius: 8,
    lineHeight: '1.8'
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
    padding: 12
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
    fontSize: '16px'
  },
  actions: {
    marginTop: 24,
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap'
  },
  actionButton: {
    minWidth: '150px',
    padding: '12px 20px',
    border: '2px solid #888',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  }
};

export default GameBoard;