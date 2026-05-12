import { useEffect, useMemo, useRef, useState } from 'react'
import { API_ORIGIN, API_ROOT_URL, FALLBACK_COUNTRIES } from '../config/appConfig'
import {
  PROFILE_BOARD_SIZES,
  PROFILE_BOARD_STYLES,
  PROFILE_MARKERS,
} from '../constants/profileOptions'
import {
  deleteSessionHistoryItem,
  getSessionHistory,
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
} from '../services/userProfileService'

function ProfilePage({ currentUser, onRequestLogin, onUserUpdated }) {
  const userId = currentUser?._id
  const avatarInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState(currentUser?.email || '')
  const [username, setUsername] = useState(currentUser?.username || '')
  const [country, setCountry] = useState(currentUser?.country || '')

  const [preferredMarker, setPreferredMarker] = useState('')
  const [preferredBoardStyle, setPreferredBoardStyle] = useState('')
  const [preferredBoardSize, setPreferredBoardSize] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState('')
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)

  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionMessage, setSessionMessage] = useState('')
  const [isViewAllOpen, setIsViewAllOpen] = useState(false)
  const [sessionSearch, setSessionSearch] = useState('')
  const [replaySessionId, setReplaySessionId] = useState('')

  const [sessionFilters, setSessionFilters] = useState({
    startDate: '',
    endDate: '',
    result: '',
    gameType: '',
    sortOrder: 'desc',
  })

  const [countries, setCountries] = useState(FALLBACK_COUNTRIES)
  const countriesMemo = useMemo(() => countries, [countries])

  useEffect(() => {
    let active = true

    async function loadCountries() {
      try {
        const response = await fetch(`${API_ROOT_URL}/auth/countries`)
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !Array.isArray(data.countries)) {
          return
        }

        if (active) {
          setCountries(data.countries)
        }
      } catch {
        // keep fallback
      }
    }

    loadCountries()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      setMessage('')

      if (!userId) {
        if (onRequestLogin) {
          onRequestLogin()
        }
        return
      }

      try {
        setLoading(true)
        const data = await getUserProfile(userId)
        if (!active) return

        setProfile(data)
        setEmail(data.email || '')
        setUsername(data.username || '')
        setCountry(data.country || '')
        setPreferredMarker(data.preference?.preferredMarker || '')
        setPreferredBoardStyle(
          data.preference?.preferredBoardStyle !== undefined &&
            data.preference?.preferredBoardStyle !== null
            ? String(data.preference.preferredBoardStyle)
            : ''
        )
        setPreferredBoardSize(data.preference?.preferredBoardSize || '')
      } catch (error) {
        if (!active) return
        setMessage(error.message || 'Failed to load profile')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [userId, onRequestLogin])

  useEffect(() => {
    let active = true

    async function loadSessions() {
      if (!userId) {
        return
      }

      try {
        setSessionsLoading(true)
        setSessionMessage('')
        const data = await getSessionHistory(userId, sessionFilters)
        if (!active) return
        setSessions(Array.isArray(data) ? data : [])
      } catch (error) {
        if (!active) return
        setSessionMessage(extractErrorMessage(error))
      } finally {
        if (active) {
          setSessionsLoading(false)
        }
      }
    }

    loadSessions()

    return () => {
      active = false
    }
  }, [userId, sessionFilters])

  const currentAvatar = useMemo(() => {
    const avatarPath = profile?.avatarUrl || currentUser?.avatarUrl || ''
    return toAssetUrl(avatarPath)
  }, [profile, currentUser])

  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [currentAvatar])

  const filteredSessions = useMemo(() => {
    const keyword = sessionSearch.trim().toLowerCase()
    if (!keyword) {
      return sessions
    }

    return sessions.filter((session, index) => {
      const sessionNo = String(index + 1)
      const opponentName = (session?.opponent?.name || '').toLowerCase()
      const sessionId = (session?.sessionId || '').toLowerCase()
      return (
        opponentName.includes(keyword) ||
        sessionId.includes(keyword) ||
        sessionNo.includes(keyword)
      )
    })
  }, [sessions, sessionSearch])

  const recentSessions = useMemo(() => filteredSessions.slice(0, 3), [filteredSessions])

  async function saveProfile() {
    if (!userId) {
      if (onRequestLogin) onRequestLogin()
      return
    }

    setMessage('')

    try {
      setLoading(true)
      const payload = {
        email,
        username,
        country,
      }

      if (preferredMarker) {
        payload.preferredMarker = preferredMarker
      }
      if (preferredBoardStyle) {
        payload.preferredBoardStyle = Number(preferredBoardStyle)
      }
      if (preferredBoardSize) {
        payload.preferredBoardSize = preferredBoardSize
      }

      const updated = await updateUserProfile(userId, {
        ...payload,
      })

      setProfile(updated)
      if (onUserUpdated) {
        onUserUpdated({
          ...currentUser,
          ...updated,
          _id: updated.userId || currentUser?._id,
        })
      }
      setMessage('Saved')
    } catch (error) {
      setMessage(extractErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  function cancelProfileChanges() {
    setMessage('')
    setEmail(profile?.email || currentUser?.email || '')
    setUsername(profile?.username || currentUser?.username || '')
    setCountry(profile?.country || currentUser?.country || '')
    setPreferredMarker(profile?.preference?.preferredMarker || '')
    setPreferredBoardStyle(
      profile?.preference?.preferredBoardStyle !== undefined &&
        profile?.preference?.preferredBoardStyle !== null
        ? String(profile.preference.preferredBoardStyle)
        : ''
    )
    setPreferredBoardSize(profile?.preference?.preferredBoardSize || '')
  }

  async function savePassword() {
    if (!userId) {
      if (onRequestLogin) onRequestLogin()
      return
    }

    setPasswordMessage('')

    const validationError = validatePasswordChange(password, confirmPassword)
    if (validationError) {
      setPasswordMessage(validationError)
      return
    }

    try {
      setLoading(true)
      await updateUserProfile(userId, {
        password,
        confirmPassword,
      })

      setPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated')
    } catch (error) {
      setPasswordMessage(extractErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  function cancelPasswordChanges() {
    setPasswordMessage('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  function openAvatarPicker() {
    avatarInputRef.current?.click()
  }

  async function handleAvatarFileChange(event) {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile || !userId) {
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(selectedFile.type)) {
      setAvatarMessage('Only JPG, PNG, or WEBP images are allowed.')
      event.target.value = ''
      return
    }

    try {
      setAvatarUploading(true)
      setAvatarMessage('')

      const result = await uploadUserAvatar(userId, selectedFile)
      const nextAvatarUrl = result?.avatarUrl || ''

      const nextProfile = {
        ...(profile || {}),
        avatarUrl: nextAvatarUrl,
      }
      setProfile(nextProfile)

      if (onUserUpdated) {
        onUserUpdated({
          ...currentUser,
          avatarUrl: nextAvatarUrl,
        })
      }

      setAvatarMessage('Avatar updated')
    } catch (error) {
      setAvatarMessage(extractErrorMessage(error))
    } finally {
      setAvatarUploading(false)
      event.target.value = ''
    }
  }

  function updateSessionFilter(field, value) {
    setSessionFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleDeleteSession(sessionId) {
    if (!userId || !sessionId) return

    const confirmDelete = window.confirm('Delete this session from history?')
    if (!confirmDelete) {
      return
    }

    try {
      setSessionMessage('')
      await deleteSessionHistoryItem(userId, sessionId)
      setSessions((prev) => prev.filter((item) => item.sessionId !== sessionId))
    } catch (error) {
      setSessionMessage(extractErrorMessage(error))
    }
  }

  function handleReplay(session) {
    if (!profile?.isPremium) {
      setSessionMessage('Replay is available only for VIP subscribers.')
      return
    }

    setReplaySessionId((prev) => (prev === session.sessionId ? '' : session.sessionId))
  }

  function clearSessionFilters() {
    setSessionFilters({
      startDate: '',
      endDate: '',
      result: '',
      gameType: '',
      sortOrder: 'desc',
    })
    setSessionSearch('')
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
            <div style={styles.profileGrid}>
              <aside style={styles.leftPane}>
                <div style={styles.avatarFrame}>
                  {currentAvatar && !avatarLoadFailed ? (
                    <img
                      src={currentAvatar}
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
                  onChange={handleAvatarFileChange}
                  style={styles.hiddenInput}
                />

                <button
                  type="button"
                  style={styles.btn}
                  onClick={openAvatarPicker}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? 'Uploading...' : 'Change Avatar'}
                </button>

                {avatarMessage ? <div style={styles.message}>{avatarMessage}</div> : null}

                <div style={styles.sideSection}>
                  <h3 style={styles.subTitle}>Recent Game Sessions</h3>

                  {sessionsLoading ? <p style={styles.note}>Loading sessions...</p> : null}
                  {sessionMessage ? <div style={styles.message}>{sessionMessage}</div> : null}

                  {!sessionsLoading && recentSessions.length === 0 ? (
                    <p style={styles.note}>No sessions yet.</p>
                  ) : null}

                  {recentSessions.map((session, index) => (
                    <div key={session.sessionId} style={styles.sessionCard}>
                      <div style={styles.sessionLine}>Session #{index + 1}</div>
                      <div style={styles.sessionLine}>Opponent: {session.opponent?.name || '-'}</div>
                      <div style={styles.sessionLine}>Type: {session.gameType || '-'}</div>
                      <div style={styles.sessionLine}>Result: {session.result || '-'}</div>
                      <div style={styles.sessionLine}>Start: {formatDateTime(session.startTime)}</div>
                      <div style={styles.sessionLine}>End: {formatDateTime(session.endTime)}</div>
                    </div>
                  ))}

                  <button
                    type="button"
                    style={styles.btn}
                    onClick={() => setIsViewAllOpen((prev) => !prev)}
                  >
                    {isViewAllOpen ? 'Hide All Sessions' : 'View All Sessions'}
                  </button>
                </div>
              </aside>

              <section style={styles.rightPane}>
                <div style={styles.section}>
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
                      {countriesMemo.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.divider} />

                  <h3 style={styles.subTitle}>Personal Preference</h3>

                  <div style={styles.row}>
                    <div style={styles.label}>Preferred marker:</div>
                    <select
                      value={preferredMarker}
                      onChange={(e) => setPreferredMarker(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">Select marker</option>
                      {PROFILE_MARKERS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.row}>
                    <div style={styles.label}>Board style:</div>
                    <select
                      value={preferredBoardStyle}
                      onChange={(e) => setPreferredBoardStyle(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">Select style</option>
                      {PROFILE_BOARD_STYLES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.row}>
                    <div style={styles.label}>Board size:</div>
                    <select
                      value={preferredBoardSize}
                      onChange={(e) => setPreferredBoardSize(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">Select board size</option>
                      {PROFILE_BOARD_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.actionRow}>
                    <button type="button" style={styles.btn} onClick={cancelProfileChanges}>
                      Cancel
                    </button>
                    <button type="button" style={styles.btn} onClick={saveProfile} disabled={loading}>
                      Save
                    </button>
                  </div>

                  <div style={styles.divider} />

                  <h3 style={styles.subTitle}>Change Password</h3>
                  {passwordMessage ? <div style={styles.message}>{passwordMessage}</div> : null}

                  <div style={styles.row}>
                    <div style={styles.label}>New password:</div>
                    <div style={styles.passwordFieldWrap}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setPasswordMessage('')
                        }}
                        style={styles.input}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={styles.eyeButton}
                        aria-label={showPassword ? 'Hide new password' : 'Show new password'}
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
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          setPasswordMessage('')
                        }}
                        style={styles.input}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        style={styles.eyeButton}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        title={showConfirmPassword ? 'Hide' : 'Show'}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div style={styles.actionRow}>
                    <button type="button" style={styles.btn} onClick={cancelPasswordChanges}>
                      Cancel
                    </button>
                    <button type="button" style={styles.btn} onClick={savePassword} disabled={loading}>
                      Save
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {isViewAllOpen ? (
              <section style={styles.tableSection}>
                <h3 style={styles.subTitle}>All Session History</h3>

                <div style={styles.filterGrid}>
                  <input
                    placeholder="Search by opponent / session number"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    style={styles.input}
                  />

                  <input
                    type="date"
                    value={sessionFilters.startDate}
                    onChange={(e) => updateSessionFilter('startDate', e.target.value)}
                    style={styles.input}
                  />

                  <input
                    type="date"
                    value={sessionFilters.endDate}
                    onChange={(e) => updateSessionFilter('endDate', e.target.value)}
                    style={styles.input}
                  />

                  <select
                    value={sessionFilters.result}
                    onChange={(e) => updateSessionFilter('result', e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All results</option>
                    <option value="win">Win</option>
                    <option value="lose">Lose</option>
                    <option value="draw">Draw</option>
                    <option value="aborted">Aborted</option>
                  </select>

                  <select
                    value={sessionFilters.gameType}
                    onChange={(e) => updateSessionFilter('gameType', e.target.value)}
                    style={styles.select}
                  >
                    <option value="">All game types</option>
                    <option value="single_player">Single Player</option>
                    <option value="two_player">Two Player (Local)</option>
                    <option value="online">Online</option>
                  </select>

                  <select
                    value={sessionFilters.sortOrder}
                    onChange={(e) => updateSessionFilter('sortOrder', e.target.value)}
                    style={styles.select}
                  >
                    <option value="desc">Start time: newest first</option>
                    <option value="asc">Start time: oldest first</option>
                  </select>

                  <button type="button" style={styles.btn} onClick={clearSessionFilters}>
                    Reset Filters
                  </button>
                </div>

                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>Start Time</th>
                        <th style={styles.th}>End Time</th>
                        <th style={styles.th}>Game Type</th>
                        <th style={styles.th}>Result</th>
                        <th style={styles.th}>Opponent</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session, index) => {
                        const isReplayOpen = replaySessionId === session.sessionId
                        return (
                          <tr key={session.sessionId}>
                            <td style={styles.td}>{index + 1}</td>
                            <td style={styles.td}>{formatDateTime(session.startTime)}</td>
                            <td style={styles.td}>{formatDateTime(session.endTime)}</td>
                            <td style={styles.td}>{session.gameType || '-'}</td>
                            <td style={styles.td}>{session.result || '-'}</td>
                            <td style={styles.td}>{session.opponent?.name || '-'}</td>
                            <td style={styles.td}>
                              <div style={styles.actionInline}>
                                <button
                                  type="button"
                                  style={styles.tableBtn}
                                  onClick={() => handleReplay(session)}
                                  disabled={!profile?.isPremium}
                                  title={
                                    profile?.isPremium
                                      ? 'Open replay'
                                      : 'Replay is for VIP subscription only'
                                  }
                                >
                                  Replay
                                </button>
                                <button
                                  type="button"
                                  style={{ ...styles.tableBtn, ...styles.deleteBtn }}
                                  onClick={() => handleDeleteSession(session.sessionId)}
                                >
                                  Delete
                                </button>
                              </div>

                              {isReplayOpen ? (
                                <div style={styles.replayBox}>
                                  {session.moves?.length ? (
                                    <>
                                      <div style={styles.replayHeader}>Replay moves</div>
                                      {session.moves.map((move) => (
                                        <div key={`${session.sessionId}-${move.moveNumber}`} style={styles.replayLine}>
                                          #{move.moveNumber} - {move.player} to {move.position}
                                        </div>
                                      ))}
                                    </>
                                  ) : (
                                    <div style={styles.replayLine}>No moves available for replay.</div>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}

                      {!filteredSessions.length ? (
                        <tr>
                          <td style={styles.td} colSpan={7}>
                            No sessions found.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function extractErrorMessage(error) {
  const data = error?.data
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors[0]?.message || error.message || 'Request failed'
  }

  return error.message || 'Request failed'
}

function validatePasswordChange(password, confirmPassword) {
  if (!password) {
    return 'Please enter a new password before saving.'
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters and include uppercase, number, and special character ($, #, @, !).'
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[$#@!]/.test(password)) {
    return 'Password must be at least 8 characters and include uppercase, number, and special character ($, #, @, !).'
  }

  if (!confirmPassword) {
    return 'Please confirm your new password before saving.'
  }

  if (password !== confirmPassword) {
    return 'Confirm password does not match the new password.'
  }

  return ''
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function toAssetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (API_ORIGIN) return `${API_ORIGIN}${path}`
  return path
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
  subTitle: { margin: '10px 0 8px' },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(240px, 1fr) minmax(0, 3fr)',
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
  },
  avatarFrame: {
    width: 170,
    height: 170,
    borderRadius: '50%',
    border: '3px solid #7c7c7c',
    overflow: 'hidden',
    margin: '0 auto',
    background: '#ffffff',
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
  hiddenInput: {
    display: 'none',
  },
  sideSection: {
    display: 'grid',
    gap: 8,
  },
  sessionCard: {
    border: '1px solid #999',
    borderRadius: 6,
    background: '#ffffff',
    padding: '8px 10px',
    display: 'grid',
    gap: 2,
  },
  sessionLine: {
    fontSize: 13,
    color: '#333',
  },
  section: { display: 'grid', gap: 10 },
  row: {
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    alignItems: 'center',
    gap: 10,
  },
  label: { textAlign: 'right', fontWeight: 600 },
  value: { textAlign: 'left' },
  input: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    padding: '8px 10px',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
  },
  passwordFieldWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
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
  divider: { height: 1, background: '#7c7c7c', margin: '8px 0' },
  message: {
    border: '2px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '8px 10px',
  },
  tableSection: {
    border: '1px solid #bcbcbc',
    borderRadius: 8,
    marginTop: 14,
    padding: 12,
    background: '#f7f7f7',
    display: 'grid',
    gap: 10,
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 8,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#ffffff',
  },
  th: {
    border: '1px solid #8f8f8f',
    background: '#ececec',
    textAlign: 'left',
    padding: '8px 10px',
    fontSize: 14,
  },
  td: {
    border: '1px solid #8f8f8f',
    padding: '8px 10px',
    verticalAlign: 'top',
    fontSize: 14,
  },
  actionInline: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  tableBtn: {
    border: '1px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: '4px 8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  deleteBtn: {
    color: '#c62828',
  },
  replayBox: {
    marginTop: 6,
    border: '1px dashed #7c7c7c',
    borderRadius: 6,
    padding: 8,
    background: '#fdfdfd',
    display: 'grid',
    gap: 4,
    maxHeight: 180,
    overflowY: 'auto',
  },
  replayHeader: {
    fontWeight: 700,
    fontSize: 13,
  },
  replayLine: {
    fontSize: 13,
    color: '#2f2f2f',
  },
  note: { margin: 0 },
  subscriptionBox: {
  border: '2px solid #7c7c7c',
  borderRadius: 8,
  background: '#ffffff',
  padding: 16,
  marginTop: 10,
},

  transactionList: {
    display: 'grid',
    gap: 10,
    marginTop: 10,
  },

  transactionCard: {
    border: '1px solid #7c7c7c',
    borderRadius: 6,
    background: '#ffffff',
    padding: 10,
    display: 'grid',
    gap: 4,
  }
}

export default ProfilePage
