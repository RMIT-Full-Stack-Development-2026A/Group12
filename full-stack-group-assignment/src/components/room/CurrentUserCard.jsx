function CurrentUserCard({ currentUsername, currentUserId, onCopyUserId, styles }) {
  return (
    <div style={styles.resultBox}>
      <p><strong>Current User</strong></p>
      <p>Username: {currentUsername || 'Unknown'}</p>
      <p>User ID: {currentUserId || 'Not found'}</p>
      <button type="button" onClick={onCopyUserId} style={styles.copyUserButton}>
        Copy User ID
      </button>
    </div>
  );
}

export default CurrentUserCard;