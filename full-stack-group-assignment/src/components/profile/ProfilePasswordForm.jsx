export default function ProfilePasswordForm({
  password, setPassword,
  confirmPassword, setConfirmPassword,
  showPassword, setShowPassword,
  showConfirmPassword, setShowConfirmPassword,
  loading,
  passwordMessage,
  onSave,
  onCancel,
}) {
  return (
    <div style={styles.section}>
      <div style={styles.divider} />
      <h3 style={styles.subTitle}>Change Password</h3>

      {passwordMessage ? <div style={styles.message}>{passwordMessage}</div> : null}

      <div style={styles.row}>
        <div style={styles.label}>New password:</div>
        <div style={styles.passwordFieldWrap}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); }}
            style={styles.input}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
            title={showPassword ? 'Hide' : 'Show'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.label}>Confirm:</div>
        <div style={styles.passwordFieldWrap}>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); }}
            style={styles.input}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            style={styles.eyeButton}
            title={showConfirmPassword ? 'Hide' : 'Show'}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div style={styles.actionRow}>
        <button type="button" style={styles.btn} onClick={onCancel}>Cancel</button>
        <button type="button" style={styles.btn} onClick={onSave} disabled={loading}>Save</button>
      </div>
    </div>
  );
}

const styles = {
  subTitle: { margin: '10px 0 8px' },
  section: { display: 'grid', gap: 10 },
  divider: { height: 1, background: '#7c7c7c', margin: '8px 0' },
  row: {
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    alignItems: 'center',
    gap: 10,
  },
  label: { textAlign: 'right', fontWeight: 600 },
  input: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '8px 10px',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
  },
  passwordFieldWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  eyeButton: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '8px 10px',
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    minWidth: 42,
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 6,
  },
  btn: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '8px 14px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  message: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '8px 10px',
  },
};
