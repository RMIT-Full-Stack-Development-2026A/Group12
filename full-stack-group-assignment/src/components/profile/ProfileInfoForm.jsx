export default function ProfileInfoForm({
  email, setEmail,
  username, setUsername,
  country, setCountry,
  countries,
  loading,
  message,
  onSave,
  onCancel,
}) {
  return (
    <section style={styles.rightPane}>
      <h3 style={styles.subTitle}>Personal Infos</h3>
      <div style={styles.section}>
        {message ? <div style={styles.message}>{message}</div> : null}

        <div style={styles.row}>
          <div style={styles.label}>Email:</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.row}>
          <div style={styles.label}>Username:</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.row}>
          <div style={styles.label}>Country:</div>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={styles.select}>
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={styles.actionRow}>
          <button type="button" style={styles.btn} onClick={onCancel}>Cancel</button>
          <button type="button" style={styles.btn} onClick={onSave} disabled={loading}>Save</button>
        </div>
      </div>
    </section>
  );
}

const styles = {
  rightPane: {
    border: '1px solid #bcbcbc',
    borderRadius: 8,
    background: '#f7f7f7',
    padding: 12,
  },
  subTitle: { margin: '10px 0 8px' },
  section: { display: 'grid', gap: 10 },
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
  select: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '8px 10px',
    background: '#ffffff',
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
