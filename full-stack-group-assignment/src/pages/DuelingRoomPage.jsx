import { useEffect, useState } from 'react';
import { getMyRooms } from '../services/roomService';
import socket from '../socket';

const KIND_LABEL = {
  ONLINE: 'ONLINE',
  SINGLE: 'vs BOT',
  LOCAL: 'LOCAL',
};

const KIND_COLOR = {
  ONLINE: '#1a3c6b',
  SINGLE: '#5a2d82',
  LOCAL: '#1a6b2e',
};

const STATUS_LABEL = {
  WAITING: 'Waiting',
  READY: 'Ready',
  PLAYING: 'Playing',
};

function DuelingRoomPage({ currentUser, onRejoin, onRequireLogin }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadEntries() {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError('');
      const res = await getMyRooms();
      const list = Array.isArray(res?.data) ? res.data : [];
      setEntries(list);
    } catch (err) {
      setError(err.message || 'Failed to load dueling rooms');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, [currentUser]);

  // Refresh list when a room is closed by auto-cleanup
  useEffect(() => {
    const handleRoomClosed = () => loadEntries();
    socket.on('room_closed', handleRoomClosed);
    return () => socket.off('room_closed', handleRoomClosed);
  }, [currentUser]);

  function handleRejoin(entry) {
    if (!currentUser) {
      onRequireLogin?.();
      return;
    }
    onRejoin(entry);
  }

  if (!currentUser) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>Dueling Room</h2>
          <p style={styles.note}>Login to see your active dueling rooms.</p>
          <button type="button" style={styles.loginBtn} onClick={() => onRequireLogin?.()}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Dueling Room</h2>
          <button type="button" style={styles.refreshBtn} onClick={loadEntries} disabled={loading}>
            {loading ? '...' : 'Refresh'}
          </button>
        </div>

        {error ? <div style={styles.errorMsg}>{error}</div> : null}

        {loading ? (
          <p style={styles.note}>Loading...</p>
        ) : entries.length === 0 ? (
          <p style={styles.note}>You have no active duels.</p>
        ) : (
          <div style={styles.list}>
            {entries.map((entry) => (
              <div key={entry.roomCode || entry.sessionId} style={styles.entryCard}>
                <div style={styles.entryInfo}>
                  <span style={{ ...styles.badge, background: KIND_COLOR[entry.kind] || '#555' }}>
                    {KIND_LABEL[entry.kind] || entry.kind}
                  </span>

                  {entry.kind === 'ONLINE' ? (
                    <>
                      <span style={styles.codeText}>#{entry.roomCode}</span>
                      {entry.opponentUsername ? (
                        <span style={styles.detail}>
                          vs <strong>{entry.opponentUsername}</strong>
                        </span>
                      ) : (
                        <span style={styles.detail}>Waiting for opponent</span>
                      )}
                    </>
                  ) : entry.kind === 'SINGLE' ? (
                    <span style={styles.detail}>
                      vs Bot{entry.aiLevel ? ` (${entry.aiLevel})` : ''}
                    </span>
                  ) : (
                    <span style={styles.detail}>Local 2-player</span>
                  )}

                  <span style={styles.detail}>
                    Board: <strong>{entry.boardSize}×{entry.boardSize}</strong>
                  </span>
                  <span style={{ ...styles.statusPill, background: entry.status === 'PLAYING' ? '#e8f5e9' : '#fff8e1' }}>
                    {STATUS_LABEL[entry.status] || entry.status}
                  </span>
                </div>

                <button
                  type="button"
                  style={styles.rejoinBtn}
                  onClick={() => handleRejoin(entry)}
                >
                  Rejoin
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
  loginBtn: {
    border: '2px solid #1a3c6b',
    borderRadius: 6,
    background: '#e3eaf5',
    padding: '8px 20px',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#1a3c6b',
    alignSelf: 'flex-start',
  },
  errorMsg: {
    border: '2px solid #c62828',
    borderRadius: 6,
    background: '#fff5f5',
    padding: '8px 10px',
    color: '#c62828',
  },
  note: { margin: 0, color: '#666', fontSize: 14 },
  list: { display: 'grid', gap: 8 },
  entryCard: {
    border: '1px solid #bcbcbc',
    borderRadius: 8,
    background: '#ffffff',
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  entryInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 12px',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  badge: {
    color: '#fff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    flexShrink: 0,
  },
  codeText: {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: 15,
    color: '#333',
  },
  detail: { fontSize: 14, color: '#555' },
  statusPill: {
    border: '1px solid #ccc',
    borderRadius: 10,
    padding: '1px 8px',
    fontSize: 12,
    color: '#444',
  },
  rejoinBtn: {
    border: '2px solid #1a3c6b',
    borderRadius: 6,
    background: '#e3eaf5',
    padding: '6px 18px',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#1a3c6b',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};

export default DuelingRoomPage;
