import { useState, useEffect } from 'react'
import { getActiveSubscriptions } from '../services/adminService'

function AdminSubscriptionsSection() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSubscriptions()

    const interval = setInterval(loadSubscriptions, 5000)

    return () => clearInterval(interval)
  }, [])

  async function loadSubscriptions() {
    setLoading(true)
    setError(null)
    try {
      const response = await getActiveSubscriptions()
      if (response.success) {
        setSubscriptions(response.data)
      } else {
        setError(response.message || 'Failed to load subscriptions')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={styles.message}>Loading subscriptions...</div>
  }

  return (
    <div style={styles.section}>
      <h1 style={styles.sectionTitle}>Subscriptions Management</h1>
      
      <div style={styles.statsCard}>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>Active Subscriptions</div>
          <div style={styles.statValue}>{subscriptions.length}</div>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Premium Status</th>
              <th style={styles.th}>Start Date</th>
              <th style={styles.th}>End Date</th>
              <th style={styles.th}>Days Remaining</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => {
              const endDate = new Date(sub.endDate)
              const today = new Date()
              const daysRemaining = Math.ceil(
                (endDate - today) / (1000 * 60 * 60 * 24)
              )

              return (
                <tr key={sub._id} style={styles.row}>
                  <td style={styles.td}>{sub.userId?.username || 'N/A'}</td>
                  <td style={styles.td}>{sub.userId?.email || 'N/A'}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(sub.isPremium
                          ? styles.badgePremium
                          : styles.badgeStandard),
                      }}
                    >
                      {sub.isPremium ? 'Premium' : 'Standard'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(sub.startDate).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    {new Date(sub.endDate).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          daysRemaining <= 7
                            ? '#c62828'
                            : daysRemaining <= 30
                              ? '#f57c00'
                              : '#2e7d32',
                      }}
                    >
                      {daysRemaining > 0 ? daysRemaining : 0} days
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {subscriptions.length === 0 && !loading && (
        <div style={styles.message}>No active subscriptions found</div>
      )}
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
  statsCard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  statItem: {
    padding: '20px',
    backgroundColor: '#ffffff',
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 600,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 700,
    color: '#333',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#ffebee',
    border: '2px solid #c62828',
    borderRadius: 6,
    color: '#c62828',
    fontWeight: 600,
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
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
  },
  badgePremium: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  badgeStandard: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
  },
  message: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
}

export default AdminSubscriptionsSection
