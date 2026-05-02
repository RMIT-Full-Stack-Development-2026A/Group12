import { useEffect, useMemo, useRef, useState } from 'react';
import { API_ROOT_URL, FALLBACK_COUNTRIES } from '../config/appConfig';
import { toAssetUrl } from '../utils/gameUtils';
import { extractErrorMessage, validatePasswordChange } from '../utils/profileUtils';
import {
  deleteSessionHistoryItem,
  getSessionHistory,
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
} from '../services/userProfileService';
import ProfileAvatarSection from '../components/profile/ProfileAvatarSection';
import ProfileInfoForm from '../components/profile/ProfileInfoForm';
import ProfilePasswordForm from '../components/profile/ProfilePasswordForm';
import SessionHistoryPanel from '../components/profile/SessionHistoryPanel';

const SESSION_PAGE_SIZE = 10;

function ProfilePage({ currentUser, onRequestLogin, onUserUpdated }) {
  const userId = currentUser?._id;
  const avatarInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(currentUser?.email || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [country, setCountry] = useState(currentUser?.country || '');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionPage, setSessionPage] = useState(1);
  const [replaySessionId, setReplaySessionId] = useState('');

  const [sessionFilters, setSessionFilters] = useState({
    startDate: '',
    endDate: '',
    result: '',
    gameType: '',
    sortOrder: 'desc',
  });

  const [countries, setCountries] = useState(FALLBACK_COUNTRIES);

  useEffect(() => {
    let active = true;
    async function loadCountries() {
      try {
        const response = await fetch(`${API_ROOT_URL}/auth/countries`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(data.countries)) return;
        if (active) setCountries(data.countries);
      } catch { /* keep fallback */ }
    }
    loadCountries();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setMessage('');
      if (!userId) { if (onRequestLogin) onRequestLogin(); return; }
      try {
        setLoading(true);
        const data = await getUserProfile(userId);
        if (!active) return;
        setProfile(data);
        setEmail(data.email || '');
        setUsername(data.username || '');
        setCountry(data.country || '');
      } catch (error) {
        if (!active) return;
        setMessage(error.message || 'Failed to load profile');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [userId, onRequestLogin]);

  useEffect(() => {
    let active = true;
    async function loadSessions() {
      if (!userId) return;
      try {
        setSessionsLoading(true);
        setSessionMessage('');
        const data = await getSessionHistory(userId, sessionFilters);
        if (!active) return;
        setSessions(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!active) return;
        setSessionMessage(extractErrorMessage(error));
      } finally {
        if (active) setSessionsLoading(false);
      }
    }
    loadSessions();
    return () => { active = false; };
  }, [userId, sessionFilters]);

  const currentAvatar = useMemo(() => {
    const avatarPath = profile?.avatarUrl || currentUser?.avatarUrl || '';
    return toAssetUrl(avatarPath);
  }, [profile, currentUser]);

  useEffect(() => { setAvatarLoadFailed(false); }, [currentAvatar]);

  const filteredSessions = useMemo(() => {
    const keyword = sessionSearch.trim().toLowerCase();
    if (!keyword) return sessions;
    return sessions.filter((session, index) => {
      const sessionNo = String(index + 1);
      const opponentName = (session?.opponent?.name || '').toLowerCase();
      const sessionId = (session?.sessionId || '').toLowerCase();
      return opponentName.includes(keyword) || sessionId.includes(keyword) || sessionNo.includes(keyword);
    });
  }, [sessions, sessionSearch]);

  const recentSessions = useMemo(() => filteredSessions.slice(0, 3), [filteredSessions]);
  const totalSessionPages = useMemo(() => Math.max(1, Math.ceil(filteredSessions.length / SESSION_PAGE_SIZE)), [filteredSessions.length]);
  const currentSessionPage = useMemo(() => Math.min(sessionPage, totalSessionPages), [sessionPage, totalSessionPages]);
  const pagedSessions = useMemo(() => {
    const start = (currentSessionPage - 1) * SESSION_PAGE_SIZE;
    return filteredSessions.slice(start, start + SESSION_PAGE_SIZE);
  }, [filteredSessions, currentSessionPage]);

  useEffect(() => { setSessionPage(1); }, [sessionSearch, sessionFilters]);
  useEffect(() => { if (sessionPage > totalSessionPages) setSessionPage(totalSessionPages); }, [sessionPage, totalSessionPages]);

  async function saveProfile() {
    if (!userId) { if (onRequestLogin) onRequestLogin(); return; }
    setMessage('');
    try {
      setLoading(true);
      const updated = await updateUserProfile(userId, { email, username, country });
      setProfile(updated);
      if (onUserUpdated) onUserUpdated({ ...currentUser, ...updated, _id: updated.userId || currentUser?._id });
      setMessage('Saved');
    } catch (error) {
      setMessage(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function cancelProfileChanges() {
    setMessage('');
    setEmail(profile?.email || currentUser?.email || '');
    setUsername(profile?.username || currentUser?.username || '');
    setCountry(profile?.country || currentUser?.country || '');
  }

  async function savePassword() {
    if (!userId) { if (onRequestLogin) onRequestLogin(); return; }
    setPasswordMessage('');
    const validationError = validatePasswordChange(password, confirmPassword);
    if (validationError) { setPasswordMessage(validationError); return; }
    try {
      setLoading(true);
      await updateUserProfile(userId, { password, confirmPassword });
      setPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated');
    } catch (error) {
      setPasswordMessage(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function cancelPasswordChanges() {
    setPasswordMessage('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleAvatarFileChange(event) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !userId) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setAvatarMessage('Only JPG, PNG, or WEBP images are allowed.');
      event.target.value = '';
      return;
    }
    try {
      setAvatarUploading(true);
      setAvatarMessage('');
      const result = await uploadUserAvatar(userId, selectedFile);
      const nextAvatarUrl = result?.avatarUrl || '';
      const nextProfile = { ...(profile || {}), avatarUrl: nextAvatarUrl };
      setProfile(nextProfile);
      if (onUserUpdated) onUserUpdated({ ...currentUser, avatarUrl: nextAvatarUrl });
      setAvatarMessage('Avatar updated');
    } catch (error) {
      setAvatarMessage(extractErrorMessage(error));
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  }

  function updateSessionFilter(field, value) {
    setSessionFilters((prev) => ({ ...prev, [field]: value }));
  }

  async function handleDeleteSession(sessionId) {
    if (!userId || !sessionId) return;
    if (!window.confirm('Delete this session from history?')) return;
    try {
      setSessionMessage('');
      await deleteSessionHistoryItem(userId, sessionId);
      setSessions((prev) => prev.filter((item) => item.sessionId !== sessionId));
    } catch (error) {
      setSessionMessage(extractErrorMessage(error));
    }
  }

  function handleReplay(session) {
    if (!profile?.isPremium) { setSessionMessage('Replay is available only for VIP subscribers.'); return; }
    setReplaySessionId((prev) => (prev === session.sessionId ? '' : session.sessionId));
  }

  function clearSessionFilters() {
    setSessionFilters({ startDate: '', endDate: '', result: '', gameType: '', sortOrder: 'desc' });
    setSessionSearch('');
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>User Profile</h2>

        {message ? <div style={styles.message}>{message}</div> : null}

        {loading ? (
          <p style={styles.note}>Loading...</p>
        ) : (
          <>
            <div className="profile-grid" style={styles.profileGrid}>
              <aside style={styles.leftPane}>
                <ProfileAvatarSection
                  avatarSrc={currentAvatar}
                  avatarLoadFailed={avatarLoadFailed}
                  setAvatarLoadFailed={setAvatarLoadFailed}
                  avatarUploading={avatarUploading}
                  avatarMessage={avatarMessage}
                  avatarInputRef={avatarInputRef}
                  onOpenPicker={() => avatarInputRef.current?.click()}
                  onFileChange={handleAvatarFileChange}
                />
                <SessionHistoryPanel
                  recentSessions={recentSessions}
                  sessionsLoading={sessionsLoading}
                  sessionMessage={sessionMessage}
                  isViewAllOpen={isViewAllOpen}
                  setIsViewAllOpen={setIsViewAllOpen}
                  sessionSearch={sessionSearch}
                  setSessionSearch={setSessionSearch}
                  sessionFilters={sessionFilters}
                  updateSessionFilter={updateSessionFilter}
                  clearSessionFilters={clearSessionFilters}
                  sessionPage={sessionPage}
                  setSessionPage={setSessionPage}
                  totalSessionPages={totalSessionPages}
                  currentSessionPage={currentSessionPage}
                  pagedSessions={pagedSessions}
                  filteredSessions={filteredSessions}
                  replaySessionId={replaySessionId}
                  onReplay={handleReplay}
                  onDelete={handleDeleteSession}
                  currentUser={currentUser}
                  profile={profile}
                />
              </aside>

              <section style={styles.rightPane}>
                <ProfileInfoForm
                  email={email} setEmail={setEmail}
                  username={username} setUsername={setUsername}
                  country={country} setCountry={setCountry}
                  countries={countries}
                  loading={loading}
                  message={null}
                  onSave={saveProfile}
                  onCancel={cancelProfileChanges}
                />
                <ProfilePasswordForm
                  password={password} setPassword={setPassword}
                  confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                  showPassword={showPassword} setShowPassword={setShowPassword}
                  showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                  loading={loading}
                  passwordMessage={passwordMessage}
                  onSave={savePassword}
                  onCancel={cancelPasswordChanges}
                />
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 18 },
  card: {
    border: '2px solid #7c7c7c',
    borderRadius: 8,
    background: '#efefef',
    padding: 16,
  },
  title: { margin: 0, padding: 8 },
  note: { margin: 0 },
  message: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '8px 10px',
  },
  profileGrid: {
    display: 'grid',
    gap: 16,
    alignItems: 'start',
  },
  leftPane: {
    border: '1px solid #bcbcbc',
    borderRadius: 8,
    background: '#f7f7f7',
    padding: 12,
    display: 'grid',
    gap: 10,
    position: 'sticky',
    top: 12,
  },
  rightPane: {
    border: '1px solid #bcbcbc',
    borderRadius: 8,
    background: '#f7f7f7',
    padding: 12,
    display: 'grid',
    gap: 10,
  },
};

export default ProfilePage;
