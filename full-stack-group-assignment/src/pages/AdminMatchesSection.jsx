import { useEffect, useState } from 'react'
import { getOngoingMatches, stopMatch } from '../services/adminService'

const REASONS = [
  'Player disconnected',
  'Timeout / stale game',
  'Rule violation',
  'Server issue',
  'Other',
]

function AdminMatchesSection() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [displayCount, setDisplayCount] = useState(20)
  const [pendingAction, setPendingAction] = useState(null)
  const [pendingReason, setPendingReason] = useState(REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadMatches()
  }, [])

  async function loadMatches() {
    setLoading(true)
    setError(null)

    try {
      const response = await getOngoingMatches()
      if (response.success) {
        setMatches(response.data)
      } else {
        setError(response.message || 'Failed to load matches')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openAction(matchId) {
    setPendingAction({ matchId, type: 'stop' })
    setPendingReason(REASONS[0])
    setCustomReason('')
    setSuccessMessage('')
    setError(null)
  }

  function closePendingAction() {
    setPendingAction(null)
    setPendingReason(REASONS[0])
    setCustomReason('')
    setError(null)
  }

  async function submitAction() {
    if (!pendingAction) return
    const reason = customReason.trim() || pendingReason
    if (!reason) {
      setError('Please select or enter a reason.')
      return
    }

    setActionLoading(true)
    setError(null)

    try {
      const response = await stopMatch(pendingAction.matchId, reason)

      if (response.success) {
        setSuccessMessage(response.message || 'Match stopped successfully')
        closePendingAction()
        loadMatches()
      } else {
        setError(response.message || 'Action failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const visibleMatches = matches.slice(0, displayCount)
  const hasMoreMatches = visibleMatches.length < matches.length

  if (loading) {
    return <div style={styles.message}>Loading ongoing matches...</div>
  }

  return (
    <div style={styles.section}>
      <h1 style={styles.sectionTitle}>Ongoing Matches</h1>
      <p style={styles.totalCount}>Active matches: {matches.length}</p>

      {error && <div style={styles.error}>{error}</div>}
      {successMessage && <div style={styles.success}>{successMessage}</div>}

      {pendingAction ? (
        <div style={styles.pendingActionCard}>
          <h2 style={styles.pendingActionTitle}>
            Stop Match
          </h2>
          <p style={styles.pendingActionText}>
            Enter the reason and confirm to notify both players.
          </p>
          <label style={styles.pendingActionLabel}>
            Reason
          </label>
          <select
            style={styles.pendingActionSelect}
            value={pendingReason}
            onChange={(event) => setPendingReason(event.target.value)}
          >
            {REASONS.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
          <textarea
            rows={3}
            style={styles.pendingActionTextarea}
            placeholder="Optional custom reason"
            value={customReason}
            onChange={(event) => setCustomReason(event.target.value)}
          />
          <div style={styles.pendingActionButtons}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={closePendingAction}
            >
              Cancel
            </button>
            <button
              type="button"
              style={styles.confirmBtn}
              onClick={submitAction}
              disabled={actionLoading}
            >
              {actionLoading ? 'Working…' : 'Confirm'}
            </button>
          </div>
        </div>
      ) : null}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Match ID</th>
              <th style={styles.th}>Room Code</th>
              <th style={styles.th}>Player 1</th>
              <th style={styles.th}>Player 2</th>
              <th style={styles.th}>Game Type</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Started</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleMatches.map((match) => (
              <tr key={match._id} style={styles.row}>
                <td style={styles.td}>{match._id}</td>
                <td style={styles.td}>{match.roomCode || '-'}</td>
                <td style={styles.td}>{match.player1Id?.username || 'Unknown'}</td>
                <td style={styles.td}>{match.player2Id?.username || 'Waiting'}</td>
                <td style={styles.td}>{match.gameType || '-'}</td>
                <td style={styles.td}>{match.status || '-'}</td>
                <td style={styles.td}>
                  {match.startTime ? new Date(match.startTime).toLocaleString() : '-'}
                </td>
                <td style={styles.td}>
                  <div style={styles.actionsCell}>
                    <button
                      style={{ ...styles.actionBtn, ...styles.stopBtn }}
                      type="button"
                      onClick={() => openAction(match._id)}
                    >
                      Stop
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleMatches.length === 0 && !loading && (
        <div style={styles.message}>No ongoing matches found</div>
      )}

      <div style={styles.tableFooter}>
        {hasMoreMatches ? (
          <>
            <button
              type="button"
              style={styles.paginationBtn}
              onClick={() => setDisplayCount((prev) => prev + 20)}
            >
              Show more
            </button>
            <button
              type="button"
              style={styles.paginationBtn}
              onClick={() => setDisplayCount(matches.length)}
            >
              Show all
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

const styles = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#333',
    margin: 0,
  },
  totalCount: {
    fontSize: 14,
    color: '#666',
    margin: 0,
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  headerRow: {
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #7c7c7c',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 700,
    color: '#333',
    borderRight: '1px solid #e0e0e0',
  },
  row: {
    borderBottom: '1px solid #e0e0e0',
  },
  td: {
    padding: '12px 16px',
    color: '#333',
    borderRight: '1px solid #e0e0e0',
  },
  actionsCell: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '8px 10px',
    border: '1px solid #7c7c7c',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
    backgroundColor: '#ffffff',
  },
  stopBtn: {
    color: '#d84315',
    borderColor: '#d84315',
  },
  tableFooter: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  paginationBtn: {
    padding: '10px 14px',
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  pendingActionCard: {
    padding: 20,
    border: '2px solid #7c7c7c',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    display: 'grid',
    gap: 12,
  },
  pendingActionTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  },
  pendingActionText: {
    margin: 0,
    color: '#555',
  },
  pendingActionLabel: {
    fontWeight: 600,
    color: '#333',
  },
  pendingActionSelect: {
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #bdbdbd',
    width: '100%',
    fontSize: 14,
  },
  pendingActionTextarea: {
    width: '100%',
    minHeight: 80,
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #bdbdbd',
    fontSize: 14,
  },
  pendingActionButtons: {
    display: 'flex',
    gap: 10,
  },
  cancelBtn: {
    padding: '10px 16px',
    border: '1px solid #7c7c7c',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  confirmBtn: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#1976d2',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#ffebee',
    border: '2px solid #c62828',
    borderRadius: 6,
    color: '#c62828',
    fontWeight: 600,
  },
  success: {
    padding: '12px 16px',
    backgroundColor: '#e8f5e9',
    border: '2px solid #2e7d32',
    borderRadius: 6,
    color: '#2e7d32',
    fontWeight: 600,
  },
  message: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
}

export default AdminMatchesSection
