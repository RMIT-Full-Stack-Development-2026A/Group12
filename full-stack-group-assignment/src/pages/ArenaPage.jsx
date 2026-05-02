import { useEffect, useState } from 'react';
import { getWaitingRooms } from '../services/roomService';

function ArenaPage({ currentUser, onJoinRoom, onRequireLogin }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await getWaitingRooms();
        if (!active) return;
        setRooms(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load rooms');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  function handleJoin(roomCode) {
    if (!currentUser) {
      onRequireLogin?.();
      return;
    }
    onJoinRoom(roomCode);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Arena — Waiting Rooms</h2>
          <button
            type="button"
            style={styles.refreshBtn}
            onClick={() => {
              setLoading(true);
              setError('');
              getWaitingRooms()
                .then((data) => setRooms(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
                .catch((err) => setError(err.message || 'Failed to load rooms'))
                .finally(() => setLoading(false));
            }}
          >
            Refresh
          </button>
        </div>

        {error ? <div style={styles.errorMsg}>{error}</div> : null}

        {loading ? (
          <p style={styles.note}>Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p style={styles.note}>No waiting rooms at the moment. Create one to get started!</p>
        ) : (
          <div style={styles.list}>
            {rooms.map((room) => (
              <div key={room.roomCode} style={styles.roomCard}>
                <div style={styles.roomInfo}>
                  <span style={styles.roomCode}>#{room.roomCode}</span>
                  <span style={styles.roomDetail}>
                    Host: <strong>{room.hostUsername}</strong>
                  </span>
                  <span style={styles.roomDetail}>
                    Board: <strong>{room.boardSize}×{room.boardSize}</strong>
                  </span>
                  <span style={styles.roomDetail}>
                    Marker: <strong>{room.hostMarker}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  style={styles.joinBtn}
                  onClick={() => handleJoin(room.roomCode)}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 18 },
  card: {
    border: '2px solid #7c7c7c',
    borderRadius: 8,
    background: '#efefef',
    padding: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { margin: 0, padding: 0 },
  refreshBtn: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '6px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  errorMsg: {
    border: '2px solid #c62828',
    borderRadius: 6,
    background: '#fff5f5',
    padding: '8px 10px',
    color: '#c62828',
    marginBottom: 10,
  },
  note: { margin: 0, color: '#555' },
  list: {
    display: 'grid',
    gap: 10,
  },
  roomCard: {
    border: '1px solid #bcbcbc',
    borderRadius: 8,
    background: '#ffffff',
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  roomInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 16px',
    alignItems: 'center',
  },
  roomCode: {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: 15,
    color: '#333',
  },
  roomDetail: {
    fontSize: 14,
    color: '#555',
  },
  joinBtn: {
    border: '2px solid #1a6b2e',
    borderRadius: 6,
    background: '#e8f5e9',
    padding: '6px 18px',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#1a6b2e',
    whiteSpace: 'nowrap',
  },
};

export default ArenaPage;
