import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthForm from './design/AuthForm'
import LoginRequiredPopup from './components/LoginRequiredPopup'
import CreateRoomPage from './pages/CreateRoomPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import ArenaPage from './pages/ArenaPage'
import DuelingRoomPage from './pages/DuelingRoomPage'
import AdminDashboard from './pages/AdminDashboard'
import WalletPage from './pages/WalletPage'
import FakeVNPay from './pages/FakeVNPay'
import QRPayment from './pages/QRPayment'
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './config/appConfig'
import { toAssetUrl } from './utils/gameUtils'

const VIEWS = {
  HOME: 'home',
  AUTH: 'auth',
  CREATE: 'create',
  PROFILE: 'profile',
  ARENA: 'arena',
  DUELING: 'dueling',
  ADMIN: 'admin',
  WALLET: 'wallet',
  FAKE_VNPAY: 'fake_vnpay',
  QR: 'qr',
  Fake_BANK: 'fake_bank',
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState(VIEWS.HOME)
  const [isSessionRestored, setIsSessionRestored] = useState(false)

  function getViewFromPath(path) {
    if (path === '/wallet') return VIEWS.WALLET
    if (path.startsWith('/fake-vnpay')) return VIEWS.FAKE_VNPAY
    if (path.startsWith('/qr-payment')) return VIEWS.QR
    if (path.startsWith('/fake-bank')) return VIEWS.Fake_BANK
    return VIEWS.HOME
  }

  function getStoredUser() {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    const savedUser = token ? getStoredUser() : null

    if (token && savedUser) {
      setCurrentUser(savedUser)
    } else {
      sessionStorage.removeItem(USER_STORAGE_KEY)
    }

    setView(getViewFromPath(window.location.pathname))
    setIsSessionRestored(true)
  }, [])
  const [isGateOpen, setIsGateOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isGamePlaying, setIsGamePlaying] = useState(false)

  const isAuthed = Boolean(currentUser)

  const [arenaJoinCode, setArenaJoinCode] = useState('')
  const [duelingResume, setDuelingResume] = useState(null)

  const shellTitle = useMemo(() => {
    if (view === VIEWS.CREATE) return 'Create Room'
    if (view === VIEWS.PROFILE) return 'User Profile'
    if (view === VIEWS.AUTH) return 'Login / Register'
    if (view === VIEWS.ARENA) return 'Arena'
    if (view === VIEWS.DUELING) return 'Dueling Room'
    if (view === VIEWS.ADMIN) return 'Admin Dashboard'
    if (view === VIEWS.WALLET) return 'Wallet & Subscription'
    return 'Tic Tac Toe'
  }, [view])

  function goHome() {
    setView(VIEWS.HOME)
    setIsMenuOpen(false)
  }

  function goProfile() {
    if (!isAuthed) {
      setIsMenuOpen(false)
      setView(VIEWS.CREATE)
      setIsGateOpen(true)
      return
    }

    setView(VIEWS.PROFILE)
    setIsMenuOpen(false)
  }

  function goCreate() {
    setView(VIEWS.CREATE)
  }

  function goArena() {
    setView(VIEWS.ARENA)
    setIsMenuOpen(false)
  }

  function goDueling() {
    setView(VIEWS.DUELING)
    setIsMenuOpen(false)
  }

  function goAdmin() {
    setView(VIEWS.ADMIN)
    setIsMenuOpen(false)
  }

  function goWallet() {
    if (!isAuthed) {
      setIsMenuOpen(false)
      setView(VIEWS.CREATE)
      setIsGateOpen(true)
      return
    }
    setView(VIEWS.WALLET)
    setIsMenuOpen(false)
  }

  function handleJoinFromArena(roomCode) {
    setArenaJoinCode(roomCode)
    setView(VIEWS.CREATE)
  }

  function handleRejoinFromDueling(entry) {
    setDuelingResume(entry)
    setView(VIEWS.CREATE)
  }

  const requireCreateLogin = useCallback(() => {
    setView(VIEWS.CREATE)
    setIsGateOpen(true)
  }, [])

  const openAuth = useCallback(() => {
    setIsGateOpen(false)
    setIsMenuOpen(false)
    setView(VIEWS.AUTH)
  }, [])

  function handleAuthSuccess(user, options = {}) {
    setCurrentUser(user)
    setView(options.openCreate ? VIEWS.CREATE : VIEWS.HOME)
    setIsMenuOpen(false)
  }

  function handleUserUpdated(nextUser) {
    setCurrentUser(nextUser)
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    sessionStorage.removeItem(USER_STORAGE_KEY)
    setCurrentUser(null)
    setIsGateOpen(false)
    setIsMenuOpen(false)
    setView(VIEWS.HOME)
  }

  function toggleMenu() {
    setIsMenuOpen((prev) => !prev)
  }

  const handleGameStatusChange = (isPlaying) => {
    setIsGamePlaying(isPlaying)
    if (isPlaying) {
      setIsMenuOpen(false)
    }
  }

  const avatarSrc = toAssetUrl(currentUser?.avatarUrl)
  const displayName = currentUser?.username || 'Anonymous'

  return (
    <div style={styles.shell}>
      <header style={styles.topbar}>
        <div style={styles.topbarTitle}>{shellTitle}</div>
      </header>

      <nav style={styles.navbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isGamePlaying ? (
            <>
              <button type="button" style={styles.navBtn} onClick={goHome}>
                Home
              </button>
              <button type="button" style={styles.navBtn} onClick={goDueling}>
                Dueling Room
              </button>
              <button type="button" style={styles.navBtn} onClick={goArena}>
                Arena
              </button>
              <button type="button" style={styles.navBtn} onClick={goWallet}>
                Wallet & Subscription
              </button>
              {currentUser?.role === 'ADMIN' ? (
                <button type="button" style={styles.navBtn} onClick={goAdmin}>
                  Admin Dashboard
                </button>
              ) : null}
            </>
          ) : null}
        </div>
        <div style={styles.navRight}>
          {!isGamePlaying && (
            <button
              type="button"
              style={styles.menuBtn}
              onClick={toggleMenu}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <span style={styles.menuIcon}>☰</span>
            </button>
          )}

          {isMenuOpen && !isGamePlaying ? (
            <div style={styles.menuPanel}>
              <div style={styles.menuUserBlock}>
                <div style={styles.avatarWrap}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="User avatar" style={styles.avatarImage} />
                  ) : (
                    <div style={styles.avatarFallback} aria-label="Default avatar" />
                  )}
                </div>
                <div style={styles.menuUsername}>{displayName}</div>
              </div>

              {isAuthed ? (
                <>
                  <button type="button" style={styles.menuAction} onClick={goProfile}>
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.menuAction,
                      ...styles.logoutAction,
                    }}
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <button type="button" style={styles.menuAction} onClick={openAuth}>
                  Login
                </button>
              )}
            </div>
          ) : null}
        </div>
      </nav>

      <main style={styles.content}>
        {view === VIEWS.HOME ? (
          <HomePage onPlay={goCreate} />
        ) : null}

        {view === VIEWS.AUTH ? (
          <AuthForm onAuthSuccess={handleAuthSuccess} onClose={goHome} />
        ) : null}

        {view === VIEWS.CREATE ? (
          <CreateRoomPage
            currentUser={currentUser}
            onRequireLogin={requireCreateLogin}
            onExitToMenu={goHome}
            initialJoinCode={arenaJoinCode}
            onInitialJoinCodeConsumed={() => setArenaJoinCode('')}
            resumeEntry={duelingResume}
            onResumeEntryConsumed={() => setDuelingResume(null)}
            onGameStatusChange={handleGameStatusChange}
          />
        ) : null}

        {view === VIEWS.ARENA ? (
          <ArenaPage
            currentUser={currentUser}
            onJoinRoom={handleJoinFromArena}
            onRequireLogin={requireCreateLogin}
          />
        ) : null}

        {view === VIEWS.DUELING ? (
          <DuelingRoomPage
            currentUser={currentUser}
            onRejoin={handleRejoinFromDueling}
            onRequireLogin={requireCreateLogin}
          />
        ) : null}

        {view === VIEWS.PROFILE ? (
          <ProfilePage
            currentUser={currentUser}
            onRequestLogin={openAuth}
            onUserUpdated={handleUserUpdated}
          />
        ) : null}

        {view === VIEWS.ADMIN ? (
          <AdminDashboard currentUser={currentUser} />
        ) : null}

        {view === VIEWS.WALLET ? (
          <WalletPage
            currentUser={currentUser}
            authReady={isSessionRestored}
            onRequestLogin={openAuth}
          />
        ) : null}
                {view === VIEWS.FAKE_VNPAY ? (
            <FakeVNPay />
        ) : null}

        {view === VIEWS.QR ? <QRPayment /> : null}

        {view === VIEWS.FAKE_BANK ? <FakeBank /> : null}
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
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  menuBtn: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '4px 10px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  menuIcon: {
    display: 'inline-block',
    fontSize: 20,
    lineHeight: 1,
    color: '#333',
  },
  menuPanel: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 220,
    border: '2px solid #7c7c7c',
    borderRadius: 8,
    background: '#ffffff',
    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.12)',
    padding: 12,
    display: 'grid',
    gap: 8,
    zIndex: 30,
  },
  menuUserBlock: {
    display: 'grid',
    justifyItems: 'center',
    gap: 8,
    borderBottom: '1px solid #d1d1d1',
    paddingBottom: 10,
    marginBottom: 2,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    border: '2px solid #7c7c7c',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    background: '#ffffff',
  },
  menuUsername: {
    fontWeight: 700,
    color: '#333',
    fontSize: 15,
  },
  menuAction: {
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    padding: '8px 6px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    color: '#333',
  },
  logoutAction: {
    color: '#c62828',
  },
  content: {
    padding: 0,
  },
}

export default App