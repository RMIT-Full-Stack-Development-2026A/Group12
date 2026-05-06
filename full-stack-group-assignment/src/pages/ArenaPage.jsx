import { useEffect, useState } from 'react';
import { getArenaRooms } from '../services/roomService';

function ArenaPage({ currentUser, onJoinRoom, onRequireLogin }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadRooms() {
    try {
      setLoading(true);
      setError('');
      const data = await getArenaRooms();
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setRooms(list);
    } catch (err) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getArenaRooms()
      .then((data) => {
        if (!active) return;
        setRooms(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load rooms');
      })
      .finally(() => { if (active) setLoading(false); });
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
          <h2 style={styles.title}>Arena</h2>
          <button type="button" style={styles.refreshBtn} onClick={loadRooms} disabled={loading}>
            {loading ? '...' : 'Refresh'}
          </button>
        </div>

        {error ? <div style={styles.errorMsg}>{error}</div> : null}

        {loading ? (
          <p style={styles.note}>Loading rooms...</p>
        ) : (
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.dot('#1a6b2e')} /> Waiting Rooms
              <span style={styles.count}>{rooms.length}</span>
            </h3>
            {rooms.length === 0 ? (
              <p style={styles.note}>No waiting rooms. Create one to get started!</p>
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
          </section>
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
    display: 'grid',
    gap: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  note: { margin: 0, color: '#666', fontSize: 14 },
  section: { display: 'grid', gap: 10 },
  sectionTitle: {
    margin: 0,
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: (color) => ({
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  count: {
    marginLeft: 4,
    background: '#ddd',
    borderRadius: 10,
    padding: '1px 7px',
    fontSize: 12,
    fontWeight: 400,
    color: '#444',
  },
  list: { display: 'grid', gap: 8 },
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
    flex: 1,
    minWidth: 0,
  },
  roomCode: {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: 15,
    color: '#333',
  },
  roomDetail: { fontSize: 14, color: '#555' },
  joinBtn: {
    border: '2px solid #1a6b2e',
    borderRadius: 6,
    background: '#e8f5e9',
    padding: '6px 18px',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#1a6b2e',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};

export default ArenaPage;
