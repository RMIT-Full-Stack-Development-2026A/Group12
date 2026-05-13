import { useState, useEffect } from 'react'
import { getAllTransactions, getTransactionStats } from '../services/adminService'

function AdminTransactionsSection() {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [transRes, statsRes] = await Promise.all([
        getAllTransactions(),
        getTransactionStats(),
      ])

      if (transRes.success) {
        setTransactions(transRes.data)
      }

      if (statsRes.success) {
        setStats(statsRes.data)
      }

      if (!transRes.success) {
        setError(transRes.message || 'Failed to load transactions')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTotalAmount = () => {
    return stats.reduce((sum, stat) => sum + (stat.totalAmount || 0), 0)
  }

  const getStatusColor = (status) => {
    // Assuming status is derived from transaction success/failure
    // You may need to adjust based on your actual data structure
    return '#2e7d32'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return <div style={styles.message}>Loading transactions...</div>
  }

  return (
    <div style={styles.section}>
      <h1 style={styles.sectionTitle}>Transactions Management</h1>

      <div style={styles.statsGrid}>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>Total Transactions</div>
          <div style={styles.statValue}>{transactions.length}</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>Total Amount</div>
          <div style={styles.statValue}>{formatCurrency(getTotalAmount())}</div>
        </div>
        {stats.map((stat) => (
          <div key={stat._id} style={styles.statItem}>
            <div style={styles.statLabel}>{stat._id || 'Unknown'}</div>
            <div style={styles.statValue}>{stat.count}</div>
            <div style={styles.statSubValue}>
              {formatCurrency(stat.totalAmount || 0)}
            </div>
          </div>
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Method</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction._id} style={styles.row}>
                <td style={styles.td}>
                  {transaction.userId?.username || 'N/A'}
                </td>
                <td style={styles.td}>
                  {transaction.userId?.email || 'N/A'}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...(transaction.type === 'DEPOSIT'
                        ? styles.badgeDeposit
                        : styles.badgeSubscription),
                    }}
                  >
                    {transaction.type}
                  </span>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...styles.badgeMethod,
                    }}
                  >
                    {transaction.method}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.amount}>
                    {formatCurrency(transaction.amount || 0)}
                  </span>
                </td>
                <td style={styles.td}>
                  {transaction.description || '-'}
                </td>
                <td style={styles.td}>
                  {new Date(transaction.createdAt).toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && !loading && (
        <div style={styles.message}>No transactions found</div>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
    fontSize: 12,
    color: '#666',
    fontWeight: 600,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: '#333',
  },
  statSubValue: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
    fontSize: 13,
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
    fontSize: 11,
    fontWeight: 600,
  },
  badgeDeposit: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  badgeSubscription: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  badgeMethod: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
  },
  amount: {
    fontWeight: 700,
    color: '#2e7d32',
  },
  message: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
}

export default AdminTransactionsSection
