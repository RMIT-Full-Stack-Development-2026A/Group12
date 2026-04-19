function LoginRequiredPopup({ isOpen, onClose, onLogin }) {
  if (!isOpen) {
    return null
  }

  return (
    <div style={styles.backdrop} role="dialog" aria-modal="true">
      <div style={styles.window}>
        <div style={styles.windowHead}>
          <div style={styles.windowTitle}>Message</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={styles.closeBtn}
          >
            X
          </button>
        </div>
        <div style={styles.windowBody}>
          <p style={styles.message}>You must login first</p>
          <button type="button" onClick={onLogin} style={styles.loginBtn}>
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.25)',
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    zIndex: 50,
  },
  window: {
    width: 'min(420px, 92vw)',
    background: '#efefef',
    border: '2px solid #7c7c7c',
    borderRadius: 6,
  },
  windowHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderBottom: '2px solid #7c7c7c',
    background: '#f5f5f5',
  },
  windowTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  closeBtn: {
    width: 26,
    height: 26,
    border: '2px solid #7c7c7c',
    borderRadius: 4,
    background: '#ffffff',
    cursor: 'pointer',
  },
  windowBody: {
    padding: 14,
    display: 'grid',
    gap: 12,
    justifyItems: 'center',
  },
  message: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: '#333',
  },
  loginBtn: {
    width: 'min(240px, 100%)',
    padding: '10px 12px',
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
  },
}

export default LoginRequiredPopup
