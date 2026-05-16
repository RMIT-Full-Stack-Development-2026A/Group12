import { useState, useEffect } from 'react'
import {
  getAllUsers,
  deleteUser,
  suspendUser,
  unsuspendUser,
} from '../services/adminService'

function AdminUsersSection({ currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [displayCount, setDisplayCount] = useState(20)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const response = await getAllUsers()
      if (response.success) {
        setUsers(response.data)
      } else {
        setError(response.message || 'Failed to load users')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteUser(userId, username) {
    if (!window.confirm(`Are you sure you want to delete user: ${username}?`)) {
      return
    }

    setActionLoading((prev) => ({ ...prev, [userId]: true }))
    try {
      const response = await deleteUser(userId)
      if (response.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId))
        setSuccessMessage(`User ${username} deleted successfully`)
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setError(response.message || 'Failed to delete user')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  async function handleSuspendUser(userId) {
    setActionLoading((prev) => ({ ...prev, [userId]: true }))
    try {
      const response = await suspendUser(userId)
      if (response.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? response.data : u))
        )
        setSuccessMessage('User suspended successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setError(response.message || 'Failed to suspend user')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  async function handleUnsuspendUser(userId) {
    setActionLoading((prev) => ({ ...prev, [userId]: true }))
    try {
      const response = await unsuspendUser(userId)
      if (response.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? response.data : u))
        )
        setSuccessMessage('User unsuspended successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setError(response.message || 'Failed to unsuspend user')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const filteredUsers = users.filter((user) => user.role !== 'ADMIN')

  const visibleUsers = filteredUsers.slice(0, displayCount)
  const hasMoreUsers = visibleUsers.length < filteredUsers.length

  if (loading) {
    return <div style={styles.message}>Loading users...</div>
  }

  return (
    <div style={styles.section}>
      <h1 style={styles.sectionTitle}>User Management</h1>
      <p style={styles.totalCount}>Total Users: {users.length}</p>

      {error && <div style={styles.error}>{error}</div>}
      {successMessage && <div style={styles.success}>{successMessage}</div>}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Country</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user._id} style={styles.row}>
                <td style={styles.td}>{user.username}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{user.country}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...(user.role === 'ADMIN'
                        ? styles.badgeAdmin
                        : styles.badgePlayer),
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...(user.isActive
                        ? styles.badgeActive
                        : styles.badgeSuspended),
                    }}
                  >
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <div style={styles.actionsCell}>
                    {user.isActive ? (
                      <button
                        style={{
                          ...styles.actionBtn,
                          ...styles.suspendBtn,
                        }}
                        onClick={() => handleSuspendUser(user._id)}
                        disabled={actionLoading[user._id]}
                      >
                        {actionLoading[user._id] ? '...' : 'Suspend'}
                      </button>
                    ) : (
                      <button
                        style={{
                          ...styles.actionBtn,
                          ...styles.unsuspendBtn,
                        }}
                        onClick={() => handleUnsuspendUser(user._id)}
                        disabled={actionLoading[user._id]}
                      >
                        {actionLoading[user._id] ? '...' : 'Unsuspend'}
                      </button>
                    )}
                    <button
                      style={{
                        ...styles.actionBtn,
                        ...styles.deleteBtn,
                      }}
                      onClick={() => handleDeleteUser(user._id, user.username)}
                      disabled={actionLoading[user._id]}
                    >
                      {actionLoading[user._id] ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleUsers.length === 0 && !loading && (
        <div style={styles.message}>No users found</div>
      )}

      <div style={styles.tableFooter}>
        {hasMoreUsers ? (
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
              onClick={() => setDisplayCount(filteredUsers.length)}
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
  badgeAdmin: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  badgePlayer: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
  },
  badgeActive: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  badgeSuspended: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  actionsCell: {
    display: 'flex',
    gap: 6,
  },
  actionBtn: {
    padding: '6px 10px',
    border: '1px solid #7c7c7c',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
    transition: 'all 0.2s ease',
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
  suspendBtn: {
    backgroundColor: '#fff3e0',
    color: '#e65100',
    border: '1px solid #e65100',
  },
  unsuspendBtn: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    border: '1px solid #2e7d32',
  },
  deleteBtn: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #c62828',
  },
  message: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
}

export default AdminUsersSection
