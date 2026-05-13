import { useCallback, useMemo, useState, useEffect } from 'react'
import AuthForm from './design/AuthForm'
import LoginRequiredPopup from './components/LoginRequiredPopup'
import CreateRoomPage from './pages/CreateRoomPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import WalletPage from './pages/WalletPage'
import ArenaPage from './pages/ArenaPage'
import AdminDashboard from './pages/AdminDashboard'
import { API_ORIGIN, TOKEN_STORAGE_KEY } from './config/appConfig'
import FakeVNPay from './pages/FakeVNPay'
import QRPayment from './pages/QRPayment'
import FakeBank from './pages/FakeBank'
import { toAssetUrl } from './utils/gameUtils'

const VIEWS = {
  HOME: 'home',
  AUTH: 'auth',
  CREATE: 'create',
  PROFILE: 'profile',
  WALLET: 'wallet',
  FAKE_VNPAY: 'fake_vnpay',
  QR: 'qr',
  FAKE_BANK: 'fake_bank',
  ARENA: 'arena',
  ADMIN: 'admin',
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState(VIEWS.HOME)
  const [isGateOpen, setIsGateOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isAuthed = Boolean(currentUser)

  const [arenaJoinCode, setArenaJoinCode] = useState('')

  const shellTitle = useMemo(() => {
    if (view === VIEWS.CREATE) return 'Create Room'
    if (view === VIEWS.PROFILE) return 'User Profile'
    if (view === VIEWS.WALLET) return 'Wallet & Subscription'
    if (view === VIEWS.AUTH) return 'Login / Register'
    if (view === VIEWS.ADMIN) return 'Admin Dashboard'
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
    setIsMenuOpen(false)
  }

  function goProfile() {
    requireAuth(() => {
      setView(VIEWS.PROFILE)
      setIsMenuOpen(false)
    })
  }

  function goWallet() {
    requireAuth(() => {
      setView(VIEWS.WALLET)
      setIsMenuOpen(false)
    })
  }

  function goCreate() {
    requireAuth(() => setView(VIEWS.CREATE))
  }

  function goArena() {
    setView(VIEWS.ARENA)
    setIsMenuOpen(false)
  }

  function goAdmin() {
    requireAuth(() => {
      setView(VIEWS.ADMIN)
      setIsMenuOpen(false)
    })
  }

  function handleJoinFromArena(roomCode) {
    setArenaJoinCode(roomCode)
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

  function handleAuthSuccess(user) {
    setCurrentUser(user)
    setView(VIEWS.CREATE)
    setIsMenuOpen(false)
  }

  function handleUserUpdated(nextUser) {
    setCurrentUser(nextUser)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setCurrentUser(null)
    setIsGateOpen(false)
    setIsMenuOpen(false)
    setView(VIEWS.AUTH)
  }

  function toggleMenu() {
    setIsMenuOpen((prev) => !prev)
  }

  const avatarSrc = toAssetUrl(currentUser?.avatarUrl)
  const displayName = currentUser?.username || 'Guest'

  useEffect(() => {
    const pathname = window.location.pathname

    if (pathname === '/fake-vnpay') {
      setView(VIEWS.FAKE_VNPAY)
      return
    }

    if (pathname === '/qr-payment') {
      setView(VIEWS.QR)
      return
    }

    if (pathname === '/fake-bank') {
      setView(VIEWS.FAKE_BANK)
      return
    }

    if (pathname === '/wallet') {
      setView(VIEWS.WALLET)
      return
    }

    if (pathname === '/profile') {
      setView(VIEWS.PROFILE)
      return
    }
  }, [])

  return (
    <div style={styles.shell}>
      <header style={styles.topbar}>
        <div style={styles.topbarTitle}>{shellTitle}</div>
      </header>

      <nav style={styles.navbar}>
        <button type="button" style={styles.navBtn} onClick={goHome}>
          Home
        </button>
        {isAuthed ? (
          <button type="button" style={styles.navBtn} onClick={goWallet}>
            Wallet
          </button>
        ) : null}
        {isAuthed && currentUser?.role === 'ADMIN' ? (
          <button type="button" style={styles.navBtn} onClick={goAdmin}>
            Admin Dashboard
          </button>
        ) : null}
        <div style={styles.navRight}>
          <button
            type="button"
            style={styles.menuBtn}
            onClick={toggleMenu}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            <span style={styles.menuIcon}>☰</span>
          </button>

          {isMenuOpen ? (
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

              <button type="button" style={styles.menuAction} onClick={goProfile}>
                Edit Profile
              </button>

              <button type="button" style={styles.menuAction} onClick={goWallet}>
                Wallet & Subscription
              </button>

              {currentUser?.role === 'ADMIN' && (
                <button type="button" style={styles.menuAction} onClick={goAdmin}>
                  Admin Dashboard
                </button>
              )}

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
            initialJoinCode={arenaJoinCode}
            onInitialJoinCodeConsumed={() => setArenaJoinCode('')}
          />
        ) : null}

        {view === VIEWS.ARENA ? (
          <ArenaPage
            currentUser={currentUser}
            onJoinRoom={handleJoinFromArena}
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

        {view === VIEWS.WALLET ? (
          <WalletPage
            currentUser={currentUser}
            onRequestLogin={openAuth}
          />
        ) : null}

        {view === VIEWS.ADMIN ? (
          <AdminDashboard />
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