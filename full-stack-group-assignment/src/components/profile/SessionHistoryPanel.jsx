import { toAlgebraicNotation } from '../../utils/gameUtils';
import { formatDateTime, resolveReplayPlayerName } from '../../utils/profileUtils';

const SESSION_PAGE_SIZE = 10;

export default function SessionHistoryPanel({
  recentSessions,
  sessionsLoading,
  sessionMessage,
  isViewAllOpen,
  setIsViewAllOpen,
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
    <div style={styles.sideSection}>
      <h3 style={styles.subTitle}>Recent Game Sessions</h3>

      {sessionsLoading ? <p style={styles.note}>Loading sessions...</p> : null}
      {sessionMessage ? <div style={styles.message}>{sessionMessage}</div> : null}

      {!sessionsLoading && recentSessions.length === 0 ? (
        <p style={styles.note}>No sessions yet.</p>
      ) : null}

      {recentSessions.map((session, index) => (
        <div key={session.sessionId} style={styles.sessionCard}>
          <div style={styles.sessionLine}>Session #{index + 1}</div>
          <div style={styles.sessionLine}>Opponent: {session.opponent?.name || '-'}</div>
          <div style={styles.sessionLine}>Type: {session.gameType || '-'}</div>
          <div style={styles.sessionLine}>Result: {session.result || '-'}</div>
          <div style={styles.sessionLine}>Start: {formatDateTime(session.startTime)}</div>
          <div style={styles.sessionLine}>End: {formatDateTime(session.endTime)}</div>
        </div>
      ))}

      <button type="button" style={styles.btn} onClick={() => setIsViewAllOpen((prev) => !prev)}>
        {isViewAllOpen ? 'Hide All Sessions' : 'View All Sessions'}
      </button>

      {isViewAllOpen ? (
        <SessionTable
          sessionSearch={sessionSearch}
          setSessionSearch={setSessionSearch}
          sessionFilters={sessionFilters}
          updateSessionFilter={updateSessionFilter}
          clearSessionFilters={clearSessionFilters}
          sessionPage={sessionPage}
          setSessionPage={setSessionPage}
          totalSessionPages={totalSessionPages}
          currentSessionPage={currentSessionPage}
          pagedSessions={pagedSessions}
          filteredSessions={filteredSessions}
          replaySessionId={replaySessionId}
          onReplay={onReplay}
          onDelete={onDelete}
          currentUser={currentUser}
          profile={profile}
        />
      ) : null}
    </div>
  );
}

function SessionTable({
  sessionSearch, setSessionSearch,
  sessionFilters, updateSessionFilter, clearSessionFilters,
  sessionPage, setSessionPage,
  totalSessionPages, currentSessionPage,
  pagedSessions, filteredSessions,
  replaySessionId, onReplay, onDelete,
  currentUser, profile,
}) {
  return (
    <section style={styles.tableSection}>
      <h3 style={styles.subTitle}>All Session History</h3>

      <div className="filter-grid" style={styles.filterGrid}>
        <input
          placeholder="Search by opponent / session number"
          value={sessionSearch}
          onChange={(e) => setSessionSearch(e.target.value)}
          style={styles.input}
        />
        <input
          type="date"
          value={sessionFilters.startDate}
          onChange={(e) => updateSessionFilter('startDate', e.target.value)}
          style={styles.input}
        />
        <input
          type="date"
          value={sessionFilters.endDate}
          onChange={(e) => updateSessionFilter('endDate', e.target.value)}
          style={styles.input}
        />
        <select
          value={sessionFilters.result}
          onChange={(e) => updateSessionFilter('result', e.target.value)}
          style={styles.select}
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
          style={styles.select}
        >
          <option value="">All game types</option>
          <option value="single_player">Single Player</option>
          <option value="two_player">Two Player (Local)</option>
          <option value="online">Online</option>
        </select>
        <select
          value={sessionFilters.sortOrder}
          onChange={(e) => updateSessionFilter('sortOrder', e.target.value)}
          style={styles.select}
        >
          <option value="desc">Start time: newest first</option>
          <option value="asc">Start time: oldest first</option>
        </select>
        <button type="button" style={styles.btn} onClick={clearSessionFilters}>
          Reset Filters
        </button>
      </div>

      <div style={styles.tableWrap}>
        <div style={styles.paginationBar}>
          <div style={styles.paginationInfo}>
            Showing {(currentSessionPage - 1) * SESSION_PAGE_SIZE + 1}
            {' - '}
            {Math.min(currentSessionPage * SESSION_PAGE_SIZE, filteredSessions.length)}
            {' of '}
            {filteredSessions.length} sessions
          </div>
          <div style={styles.paginationActions}>
            <button
              type="button"
              style={styles.tableBtn}
              onClick={() => setSessionPage((prev) => Math.max(1, prev - 1))}
              disabled={currentSessionPage <= 1}
            >
              Previous
            </button>
            <span style={styles.paginationInfo}>Page {currentSessionPage}/{totalSessionPages}</span>
            <button
              type="button"
              style={styles.tableBtn}
              onClick={() => setSessionPage((prev) => Math.min(totalSessionPages, prev + 1))}
              disabled={currentSessionPage >= totalSessionPages}
            >
              Next
            </button>
          </div>
        </div>

        <table className="profile-table" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Start Time</th>
              <th style={styles.th}>End Time</th>
              <th style={styles.th}>Game Type</th>
              <th style={styles.th}>Result</th>
              <th style={styles.th}>Opponent</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedSessions.map((session, index) => {
              const isReplayOpen = replaySessionId === session.sessionId;
              const displayIndex = (currentSessionPage - 1) * SESSION_PAGE_SIZE + index + 1;
              return (
                <tr key={session.sessionId}>
                  <td style={styles.td}>{displayIndex}</td>
                  <td style={styles.td}>{formatDateTime(session.startTime)}</td>
                  <td style={styles.td}>{formatDateTime(session.endTime)}</td>
                  <td style={styles.td}>{session.gameType || '-'}</td>
                  <td style={styles.td}>{session.result || '-'}</td>
                  <td style={styles.td}>{session.opponent?.name || '-'}</td>
                  <td style={styles.td}>
                    <div style={styles.actionInline}>
                      <button
                        type="button"
                        style={styles.tableBtn}
                        onClick={() => onReplay(session)}
                        disabled={!profile?.isPremium}
                        title={profile?.isPremium ? 'Open replay' : 'Replay is for VIP subscription only'}
                      >
                        Replay
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.tableBtn, ...styles.deleteBtn }}
                        onClick={() => onDelete(session.sessionId)}
                      >
                        Delete
                      </button>
                    </div>
                    {isReplayOpen ? (
                      <div style={styles.replayBox}>
                        {session.moves?.length ? (
                          <>
                            <div style={styles.replayHeader}>Replay moves</div>
                            {session.moves.map((move) => (
                              <div key={`${session.sessionId}-${move.moveNumber}`} style={styles.replayLine}>
                                #{move.moveNumber} -{' '}
                                {resolveReplayPlayerName(session, move.player, currentUser?.username || 'You')} to{' '}
                                {toAlgebraicNotation(move.position) || move.position || '-'}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div style={styles.replayLine}>No moves available for replay.</div>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!filteredSessions.length ? (
              <tr>
                <td style={styles.td} colSpan={7}>No sessions found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const styles = {
  sideSection: { display: 'grid', gap: 8 },
  subTitle: { margin: '10px 0 8px' },
  note: { margin: 0 },
  message: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '8px 10px',
  },
  sessionCard: {
    border: '1px solid #999',
    borderRadius: 6,
    background: '#ffffff',
    padding: '8px 10px',
    display: 'grid',
    gap: 2,
  },
  sessionLine: { fontSize: 13, color: '#333' },
  btn: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '8px 14px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  tableSection: {
    border: '1px solid #bcbcbc',
    borderRadius: 8,
    marginTop: 14,
    padding: 12,
    background: '#f7f7f7',
    display: 'grid',
    gap: 10,
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 8,
  },
  input: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '8px 10px',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '8px 10px',
    background: '#ffffff',
  },
  tableWrap: { overflowX: 'auto' },
  paginationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  paginationActions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  paginationInfo: { fontSize: 13, color: '#333' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#ffffff' },
  th: {
    border: '1px solid #8f8f8f',
    background: '#ececec',
    textAlign: 'left',
    padding: '8px 10px',
    fontSize: 14,
  },
  td: { border: '1px solid #8f8f8f', padding: '8px 10px', verticalAlign: 'top', fontSize: 14 },
  actionInline: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tableBtn: {
    border: '1px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '4px 8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  deleteBtn: { color: '#c62828' },
  replayBox: {
    marginTop: 6,
    border: '1px dashed #7c7c7c',
    borderRadius: 6,
    padding: 8,
    background: '#fdfdfd',
    display: 'grid',
    gap: 4,
    maxHeight: 180,
    overflowY: 'auto',
  },
  replayHeader: { fontWeight: 700, fontSize: 13 },
  replayLine: { fontSize: 13, color: '#2f2f2f' },
};
