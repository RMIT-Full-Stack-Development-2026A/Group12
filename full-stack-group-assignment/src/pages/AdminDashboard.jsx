import { useState, useEffect } from 'react'
import AdminUsersSection from './AdminUsersSection'
import AdminSubscriptionsSection from './AdminSubscriptionsSection'
import AdminTransactionsSection from './AdminTransactionsSection'
import AdminMatchesSection from './AdminMatchesSection'

const SECTIONS = {
  USERS: 'users',
  SUBSCRIPTIONS: 'subscriptions',
  TRANSACTIONS: 'transactions',
  MATCHES: 'matches',
}

function AdminDashboard({ currentUser }) {
  const [activeSection, setActiveSection] = useState(SECTIONS.USERS)

  return (
    <div style={styles.container}>
      {/* Left Sidebar Menu */}
      <aside style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>Admin Panel</h2>
        <nav style={styles.menu}>
          <button
            style={{
              ...styles.menuItem,
              ...(activeSection === SECTIONS.USERS ? styles.menuItemActive : {}),
            }}
            onClick={() => setActiveSection(SECTIONS.USERS)}
          >
            Users
          </button>
          <button
            style={{
              ...styles.menuItem,
              ...(activeSection === SECTIONS.SUBSCRIPTIONS ? styles.menuItemActive : {}),
            }}
            onClick={() => setActiveSection(SECTIONS.SUBSCRIPTIONS)}
          >
            Subscriptions
          </button>
          <button
            style={{
              ...styles.menuItem,
              ...(activeSection === SECTIONS.TRANSACTIONS ? styles.menuItemActive : {}),
            }}
            onClick={() => setActiveSection(SECTIONS.TRANSACTIONS)}
          >
            Transactions
          </button>
          <button
            style={{
              ...styles.menuItem,
              ...(activeSection === SECTIONS.MATCHES ? styles.menuItemActive : {}),
            }}
            onClick={() => setActiveSection(SECTIONS.MATCHES)}
          >
            Ongoing Matches
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={styles.content}>
        {activeSection === SECTIONS.USERS && <AdminUsersSection currentUser={currentUser} />}
        {activeSection === SECTIONS.SUBSCRIPTIONS && <AdminSubscriptionsSection />}
        {activeSection === SECTIONS.TRANSACTIONS && <AdminTransactionsSection />}
        {activeSection === SECTIONS.MATCHES && <AdminMatchesSection />}
      </main>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    height: 'calc(100svh - 120px)',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    width: 200,
    borderRight: '2px solid #7c7c7c',
    padding: '20px',
    backgroundColor: '#ffffff',
    overflowY: 'auto',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 20,
    color: '#333',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  menuItem: {
    padding: '12px 16px',
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
    textAlign: 'left',
    color: '#333',
    transition: 'all 0.2s ease',
  },
  menuItemActive: {
    background: '#333',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
}

export default AdminDashboard
