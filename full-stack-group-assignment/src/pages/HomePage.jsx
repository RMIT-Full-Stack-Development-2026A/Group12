function HomePage({ onPlay }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.heroBox}>
          <h1 style={styles.title}>Welcome To TikTakToe !</h1>
          <button type="button" onClick={onPlay} style={styles.primaryBtn}>
            Play
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: 18,
  },
  card: {
    border: '2px solid #7c7c7c',
    borderRadius: 8,
    background: '#efefef',
    minHeight: 520,
    display: 'grid',
    placeItems: 'center',
  },
  heroBox: {
    display: 'grid',
    gap: 14,
    justifyItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 44,
    fontWeight: 700,
    color: '#3a3a3a',
  },
  primaryBtn: {
    width: 240,
    padding: '10px 12px',
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
  },
}

export default HomePage
