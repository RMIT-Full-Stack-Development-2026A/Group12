import { useEffect, useState } from 'react';
import socket from '../socket';
import { getRoom, getSessionByRoom } from '../services/roomService';
import GameBoard from '../components/GameBoard';

export default function SpectatorPage({ roomCode, currentUser, onBack }) {
  const [roomData, setRoomData] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomCode) return;
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const [roomRes, sessionRes] = await Promise.all([
          getRoom(roomCode),
          getSessionByRoom(roomCode),
        ]);
        if (!active) return;
        setRoomData(roomRes?.data || roomRes || null);
        setSessionData(sessionRes?.data || sessionRes || null);
      } catch (e) {
        if (!active) return;
        setError(e.message || 'Failed to load game');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    socket.emit('join_room_channel', roomCode);

    const handleRoomUpdated = (updated) => { setRoomData(updated); };
    const handleSessionUpdated = (updated) => { setSessionData(updated); };

    socket.on('room_updated', handleRoomUpdated);
    socket.on('session_updated', handleSessionUpdated);

    return () => {
      active = false;
      socket.off('room_updated', handleRoomUpdated);
      socket.off('session_updated', handleSessionUpdated);
      socket.emit('leave_room_channel', roomCode);
    };
  }, [roomCode]);

  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <div style={styles.errorBox}>{error}</div>
        <button type="button" style={styles.backBtn} onClick={onBack}>Back to Arena</button>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div style={styles.center}>
        <p>Room not found or game has ended.</p>
        <button type="button" style={styles.backBtn} onClick={onBack}>Back to Arena</button>
      </div>
    );
  }

  const resultData = {
    data: {
      room: roomData,
      session: sessionData,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button type="button" style={styles.backBtn} onClick={onBack}>
          ← Back to Arena
        </button>
        <span style={styles.roomLabel}>Spectating room <strong>#{roomCode}</strong></span>
      </div>

      <GameBoard
        boardSize={roomData.boardSize || 10}
        gameMode={sessionData?.gameType || 'ONLINE'}
        roomCode={roomCode}
        currentUser={currentUser}
        roomData={roomData}
        resultData={resultData}
        readOnly
        onBackToCreate={onBack}
      />
    </div>
  );
}

const styles = {
  page: { display: 'grid', gap: 0 },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 18px',
    borderBottom: '1px solid #d0d0d0',
    background: '#f5f5f5',
  },
  backBtn: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  roomLabel: { fontSize: 14, color: '#444' },
  center: {
    display: 'grid',
    gap: 12,
    justifyItems: 'center',
    padding: 40,
  },
  errorBox: {
    border: '2px solid #c62828',
    borderRadius: 6,
    background: '#fff5f5',
    color: '#c62828',
    padding: '10px 16px',
  },
};
