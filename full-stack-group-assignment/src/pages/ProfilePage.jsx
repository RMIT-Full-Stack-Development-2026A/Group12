import { useEffect, useMemo, useState } from 'react'
import { API_ROOT_URL, FALLBACK_COUNTRIES } from '../config/appConfig'
import {
  PROFILE_BOARD_SIZES,
  PROFILE_BOARD_STYLES,
  PROFILE_MARKERS,
} from '../constants/profileOptions'
import { getUserProfile, updateUserProfile } from '../services/userProfileService'

function ProfilePage({ currentUser, onRequestLogin }) {
  const userId = currentUser?._id

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [profile, setProfile] = useState(null)
  const [username, setUsername] = useState(currentUser?.username || '')
  const [country, setCountry] = useState(currentUser?.country || '')

  const [preferredMarker, setPreferredMarker] = useState('')
  const [preferredBoardStyle, setPreferredBoardStyle] = useState('')
  const [preferredBoardSize, setPreferredBoardSize] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

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

  async function saveProfile() {
    if (!userId) {
      if (onRequestLogin) onRequestLogin()
      return
    }

    setMessage('')

    try {
      setLoading(true)
      const payload = {
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
      setMessage('Saved')
    } catch (error) {
      setMessage(extractErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  function cancelProfileChanges() {
    setMessage('')
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
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>User Profile</h2>

        {message ? <div style={styles.message}>{message}</div> : null}

        {loading ? (
          <p style={styles.note}>Loading...</p>
        ) : (
          <div style={styles.section}>
            <div style={styles.row}>
              <div style={styles.label}>Email:</div>
              <div style={styles.value}>{profile?.email || currentUser?.email || '-'}</div>
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.label}>Confirm:</div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
              />
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
  note: { margin: 0 },
}

export default ProfilePage
