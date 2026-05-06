export default function ProfileAvatarSection({
  avatarSrc,
  avatarLoadFailed,
  setAvatarLoadFailed,
  avatarUploading,
  avatarMessage,
  avatarInputRef,
  onOpenPicker,
  onFileChange,
}) {
  return (
    <>
      <div style={styles.avatarFrame}>
        {avatarSrc && !avatarLoadFailed ? (
          <img
            src={avatarSrc}
            alt="Avatar"
            style={styles.avatarImage}
            onError={() => setAvatarLoadFailed(true)}
          />
        ) : (
          <div style={styles.avatarFallback} />
        )}
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onFileChange}
        style={styles.hiddenInput}
      />

      <button
        type="button"
        style={styles.btn}
        onClick={onOpenPicker}
        disabled={avatarUploading}
      >
        {avatarUploading ? 'Uploading...' : 'Change Avatar'}
      </button>

      {avatarMessage ? <div style={styles.message}>{avatarMessage}</div> : null}
    </>
  );
}

const styles = {
  avatarFrame: {
    width: 170,
    height: 170,
    borderRadius: '50%',
    border: '3px solid #7c7c7c',
    overflow: 'hidden',
    margin: '0 auto',
    background: '#ffffff',
  },
  avatarImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  avatarFallback: { width: '100%', height: '100%', background: '#ffffff' },
  hiddenInput: { display: 'none' },
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
