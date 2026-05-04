import { toAlgebraicNotation } from '../../utils/gameUtils';
import { formatDateTime, resolveReplayPlayerName } from '../../utils/profileUtils';

const SESSION_PAGE_SIZE = 10;

export default function SessionHistoryPanel({
  recentSessions,
  sessionsLoading,
  sessionMessage,
  isViewAllOpen,
  setIsViewAllOpen,
}) {
  return (
    <div style={styles.sideSection}>
      <h3 style={styles.subTitle}>Recent Sessions</h3>

      {sessionsLoading ? <p style={styles.note}>Loading...</p> : null}
      {sessionMessage ? <div style={styles.message}>{sessionMessage}</div> : null}

      {!sessionsLoading && recentSessions.length === 0 ? (
        <p style={styles.note}>No sessions yet.</p>
      ) : null}

      <div style={styles.recentList}>
        {recentSessions.map((session, index) => (
          <div key={session.sessionId} style={styles.sessionCard}>
            <div style={styles.cardTop}>
              <span style={styles.sessionNum}>#{index + 1}</span>
              <span style={getBadgeStyle(session.result)}>{session.result || '—'}</span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>vs</span>
              <span style={styles.cardVal}>{session.opponent?.name || '—'}</span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Type</span>
              <span style={styles.cardVal}>{session.gameType || '—'}</span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Start</span>
              <span style={styles.cardVal}>{formatDateTime(session.startTime)}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        style={styles.btn}
        onClick={() => setIsViewAllOpen((prev) => !prev)}
      >
        {isViewAllOpen ? 'Hide All Sessions' : 'View All Sessions'}
      </button>
    </div>
  );
}

export function SessionTablePanel({
  sessionSearch,
  setSessionSearch,
  sessionFilters,
  updateSessionFilter,
  clearSessionFilters,
  sessionPage,
  setSessionPage,
  totalSessionPages,
  currentSessionPage,
  pagedSessions,
  filteredSessions,
  replaySessionId,
  onReplay,
  onDelete,
  currentUser,
  profile,
}) {
  return (
    <section style={styles.tableSection}>
      <h3 style={styles.subTitle}>All Session History</h3>

      <div style={styles.filterBlock}>
        <input
          placeholder="Search by opponent or session #"
          value={sessionSearch}
          onChange={(e) => setSessionSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.filterRow}>
          <input
            type="date"
            value={sessionFilters.startDate}
            onChange={(e) => updateSessionFilter('startDate', e.target.value)}
            style={styles.filterInput}
            title="From date"
          />
          <input
            type="date"
            value={sessionFilters.endDate}
            onChange={(e) => updateSessionFilter('endDate', e.target.value)}
            style={styles.filterInput}
            title="To date"
          />
          <select
            value={sessionFilters.result}
            onChange={(e) => updateSessionFilter('result', e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All results</option>
            <option value="win">Win</option>
            <option value="lose">Lose</option>
            <option value="draw">Draw</option>
            <option value="aborted">Aborted</option>
          </select>
          <select
            value={sessionFilters.gameType}
            onChange={(e) => updateSessionFilter('gameType', e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All types</option>
            <option value="single_player">Single Player</option>
            <option value="two_player">Local</option>
            <option value="online">Online</option>
          </select>
          <select
            value={sessionFilters.sortOrder}
            onChange={(e) => updateSessionFilter('sortOrder', e.target.value)}
            style={styles.filterSelect}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <button type="button" style={styles.resetBtn} onClick={clearSessionFilters}>
            Reset
          </button>
        </div>
      </div>

      <div style={styles.paginationBar}>
        <span style={styles.pageInfo}>
          {filteredSessions.length === 0
            ? 'No sessions'
            : `Showing ${(currentSessionPage - 1) * SESSION_PAGE_SIZE + 1}–${Math.min(
                currentSessionPage * SESSION_PAGE_SIZE,
                filteredSessions.length
              )} of ${filteredSessions.length}`}
        </span>
        <div style={styles.pageActions}>
          <button
            type="button"
            style={styles.pageBtn}
            onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
            disabled={currentSessionPage <= 1}
          >
            ‹ Prev
          </button>
          <span style={styles.pageNum}>
            {currentSessionPage} / {totalSessionPages || 1}
          </span>
          <button
            type="button"
            style={styles.pageBtn}
            onClick={() => setSessionPage((p) => Math.min(totalSessionPages, p + 1))}
            disabled={currentSessionPage >= totalSessionPages}
          >
            Next ›
          </button>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: 36 }}>#</th>
              <th style={{ ...styles.th, minWidth: 120 }}>Start Time</th>
              <th style={{ ...styles.th, minWidth: 120 }}>End Time</th>
              <th style={{ ...styles.th, minWidth: 90 }}>Type</th>
              <th style={{ ...styles.th, minWidth: 70 }}>Result</th>
              <th style={{ ...styles.th, minWidth: 110 }}>Opponent</th>
              <th style={{ ...styles.th, minWidth: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedSessions.map((session, index) => {
              const isReplayOpen = replaySessionId === session.sessionId;
              const rowNum = (currentSessionPage - 1) * SESSION_PAGE_SIZE + index + 1;
              return (
                <tr key={session.sessionId} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.tdCenter}>{rowNum}</td>
                  <td style={styles.td}>{formatDateTime(session.startTime)}</td>
                  <td style={styles.td}>{formatDateTime(session.endTime) || '—'}</td>
                  <td style={styles.td}>{session.gameType || '—'}</td>
                  <td style={{ ...styles.td, ...getResultStyle(session.result) }}>
                    {session.result || '—'}
                  </td>
                  <td style={styles.td}>{session.opponent?.name || '—'}</td>
                  <td style={styles.tdActions}>
                    <div style={styles.actionRow}>
                      <button
                        type="button"
                        style={styles.replayBtn}
                        onClick={() => onReplay(session)}
                        disabled={!profile?.isPremium}
                        title={profile?.isPremium ? 'Replay moves' : 'VIP only'}
                      >
                        Replay
                      </button>
                      <button
                        type="button"
                        style={styles.deleteBtn}
                        onClick={() => onDelete(session.sessionId)}
                      >
                        Delete
                      </button>
                    </div>
                    {isReplayOpen ? (
                      <div style={styles.replayBox}>
                        <div style={styles.replayHeader}>Move log</div>
                        {session.moves?.length ? (
                          session.moves.map((move) => (
                            <div key={`${session.sessionId}-${move.moveNumber}`} style={styles.replayLine}>
                              #{move.moveNumber} —{' '}
                              {resolveReplayPlayerName(session, move.player, currentUser?.username || 'You')}{' '}
                              → {toAlgebraicNotation(move.position) || move.position || '?'}
                            </div>
                          ))
                        ) : (
                          <div style={styles.replayLine}>No moves recorded.</div>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {filteredSessions.length === 0 ? (
              <tr>
                <td style={styles.tdEmpty} colSpan={7}>No sessions match your filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getBadgeStyle(result) {
  const r = (result || '').toLowerCase();
  const map = {
    win: { bg: '#e8f5e9', color: '#1a6b2e' },
    lose: { bg: '#ffebee', color: '#c62828' },
    draw: { bg: '#fff8e1', color: '#b45309' },
  };
  const { bg = '#f0f0f0', color = '#555' } = map[r] || {};
  return {
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 10,
    background: bg,
    color,
    textTransform: 'uppercase',
  };
}

function getResultStyle(result) {
  const r = (result || '').toLowerCase();
  if (r === 'win') return { color: '#1a6b2e', fontWeight: 700 };
  if (r === 'lose') return { color: '#c62828', fontWeight: 700 };
  if (r === 'draw') return { color: '#b45309', fontWeight: 700 };
  return {};
}

const styles = {
  sideSection: { display: 'grid', gap: 8 },
  subTitle: { margin: '6px 0 4px', fontSize: 15 },
  note: { margin: 0, fontSize: 13, color: '#555' },
  message: {
    border: '1px solid #aaa',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 13,
  },
  recentList: { display: 'grid', gap: 6 },
  sessionCard: {
    border: '1px solid #d0d0d0',
    borderRadius: 7,
    background: '#ffffff',
    padding: '8px 10px',
    display: 'grid',
    gap: 4,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sessionNum: { fontSize: 12, fontWeight: 700, color: '#444' },
  cardRow: { display: 'flex', justifyContent: 'space-between', gap: 4, fontSize: 12 },
  cardLabel: { color: '#999', flexShrink: 0 },
  cardVal: { color: '#333', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' },
  btn: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '7px 14px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    justifySelf: 'start',
  },
  // SessionTablePanel styles
  tableSection: {
    border: '1px solid #bcbcbc',
    borderRadius: 8,
    padding: 16,
    background: '#f7f7f7',
    display: 'grid',
    gap: 12,
    marginTop: 12,
  },
  filterBlock: { display: 'grid', gap: 8 },
  searchInput: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '8px 10px',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 13,
  },
  filterRow: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  filterInput: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '6px 8px',
    background: '#ffffff',
    fontSize: 13,
    cursor: 'pointer',
  },
  filterSelect: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '6px 8px',
    background: '#ffffff',
    fontSize: 13,
    cursor: 'pointer',
  },
  resetBtn: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '6px 12px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  paginationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  pageInfo: { fontSize: 13, color: '#555' },
  pageActions: { display: 'flex', alignItems: 'center', gap: 6 },
  pageBtn: {
    border: '1px solid #7c7c7c',
    borderRadius: 5,
    background: '#ffffff',
    padding: '4px 10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  pageNum: { fontSize: 13, color: '#333', minWidth: 46, textAlign: 'center' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#ffffff', minWidth: 600 },
  th: {
    border: '1px solid #c0c0c0',
    background: '#e8e8e8',
    textAlign: 'left',
    padding: '9px 10px',
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  td: { border: '1px solid #c0c0c0', padding: '8px 10px', verticalAlign: 'top', fontSize: 13 },
  tdCenter: { border: '1px solid #c0c0c0', padding: '8px 10px', textAlign: 'center', fontSize: 13 },
  tdActions: { border: '1px solid #c0c0c0', padding: '8px 10px', verticalAlign: 'top', fontSize: 13 },
  tdEmpty: { border: '1px solid #c0c0c0', padding: '12px 10px', textAlign: 'center', color: '#888', fontSize: 13 },
  rowEven: { background: '#ffffff' },
  rowOdd: { background: '#f9f9f9' },
  actionRow: { display: 'flex', gap: 5, flexWrap: 'wrap' },
  replayBtn: {
    border: '1px solid #7c7c7c',
    borderRadius: 5,
    background: '#ffffff',
    padding: '3px 8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
  },
  deleteBtn: {
    border: '1px solid #c62828',
    borderRadius: 5,
    background: '#fff5f5',
    color: '#c62828',
    padding: '3px 8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
  },
  replayBox: {
    marginTop: 8,
    border: '1px dashed #9e9e9e',
    borderRadius: 6,
    padding: 8,
    background: '#fafafa',
    display: 'grid',
    gap: 3,
    maxHeight: 200,
    overflowY: 'auto',
  },
  replayHeader: { fontWeight: 700, fontSize: 12, color: '#333', marginBottom: 2 },
  replayLine: { fontSize: 12, color: '#444' },
};
