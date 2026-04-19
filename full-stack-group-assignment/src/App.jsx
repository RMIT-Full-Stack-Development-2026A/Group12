import { useMemo, useState } from 'react'
import AuthForm from './design/AuthForm'
import LoginRequiredPopup from './components/LoginRequiredPopup'
import CreateRoomPage from './pages/CreateRoomPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'

const VIEWS = {
  HOME: 'home',
  AUTH: 'auth',
  CREATE: 'create',
  PROFILE: 'profile',
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState(VIEWS.HOME)
  const [isGateOpen, setIsGateOpen] = useState(false)

  const isAuthed = Boolean(currentUser)

  const shellTitle = useMemo(() => {
    if (view === VIEWS.CREATE) return 'Create Room'
    if (view === VIEWS.PROFILE) return 'User Profile'
    if (view === VIEWS.AUTH) return 'Login / Register'
    return 'Tic Tac Toe'
  }, [view])

  function requireAuth(action) {
    if (isAuthed) {
      action()
      return
    }

    setIsGateOpen(true)
  }

  function goHome() {
    setView(VIEWS.HOME)
  }

  function goProfile() {
    requireAuth(() => setView(VIEWS.PROFILE))
  }

  function goCreate() {
    requireAuth(() => setView(VIEWS.CREATE))
  }

  function openAuth() {
    setIsGateOpen(false)
    setView(VIEWS.AUTH)
  }

  function handleAuthSuccess(user) {
    setCurrentUser(user)
    setView(VIEWS.CREATE)
  }

  return (
    <div style={styles.shell}>
      <header style={styles.topbar}>
        <div style={styles.topbarTitle}>{shellTitle}</div>
      </header>

      <nav style={styles.navbar}>
        <button type="button" style={styles.navBtn} onClick={goHome}>
          Home
        </button>
        <div style={styles.navRight}>
          <button type="button" style={styles.navBtn} onClick={goProfile}>
            Profile
          </button>
          <span style={styles.navDivider}>|||</span>
        </div>
      </nav>

      <main style={styles.content}>
        {view === VIEWS.HOME ? (
          <HomePage onPlay={goCreate} onProfile={goProfile} />
        ) : null}

        {view === VIEWS.AUTH ? (
          <AuthForm onAuthSuccess={handleAuthSuccess} onClose={goHome} />
        ) : null}

        {view === VIEWS.CREATE ? (
          <CreateRoomPage currentUser={currentUser} />
        ) : null}

        {view === VIEWS.PROFILE ? (
          <ProfilePage currentUser={currentUser} onRequestLogin={openAuth} />
        ) : null}
      </main>

      <LoginRequiredPopup
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        onLogin={openAuth}
      />
    </div>
  )
}

const styles = {
  shell: {
    width: 'min(1100px, 100%)',
    margin: '0 auto',
    minHeight: '100svh',
    borderLeft: '2px solid #7c7c7c',
    borderRight: '2px solid #7c7c7c',
    background: '#ffffff',
  },
  topbar: {
    borderBottom: '2px solid #7c7c7c',
    padding: '10px 12px',
    textAlign: 'center',
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#333',
  },
  navbar: {
    borderBottom: '2px solid #7c7c7c',
    padding: '8px 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  navDivider: {
    display: 'inline-block',
    fontWeight: 700,
    color: '#333',
  },
  navBtn: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  content: {
    padding: 0,
  },
}

export default App