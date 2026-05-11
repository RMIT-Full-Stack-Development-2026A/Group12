import { useEffect, useMemo, useState } from 'react'
import './AuthForm.css'

import {
  API_ROOT_URL,
  FALLBACK_COUNTRIES,
  TOKEN_STORAGE_KEY,
} from '../config/appConfig'

const AUTH_URL = `${API_ROOT_URL}/auth`

const initialRegisterForm = {
  email: '',
  username: '',
  country: '',
  password: '',
  confirmPassword: '',
}

function AuthForm({ onAuthSuccess, onClose }) {
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')
  const [countryOptions, setCountryOptions] = useState(FALLBACK_COUNTRIES)

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const [registerForm, setRegisterForm] = useState(initialRegisterForm)

  async function requestJson(url, options) {
    let response
    try {
      response = await fetch(url, options)
    } catch {
      return {
        ok: false,
        status: 0,
        data: { message: 'Network error: cannot reach server' },
      }
    }

    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  }

  function saveToken(token) {
    if (!token) {
      return
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }

  function getAuthorizationHeader() {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function verifyProtectedSession(userId) {
    if (!userId) {
      return
    }

    try {
      await fetch(`${API_ROOT_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          ...getAuthorizationHeader(),
        },
      })
    } catch {
      // Do not leak token state in UI.
    }
  }

  const filteredCountries = useMemo(() => {
    return countryOptions
  }, [countryOptions])

  useEffect(() => {
    let isMounted = true

    async function loadCountries() {
      const result = await requestJson(`${AUTH_URL}/countries`)
      if (!result.ok || !Array.isArray(result.data.countries)) {
        return
      }

      if (isMounted) {
        setCountryOptions(result.data.countries)
      }
    }

    loadCountries()

    return () => {
      isMounted = false
    }
  }, [])

  function updateLoginField(field) {
    return (event) => {
      setLoginForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  function updateRegisterField(field) {
    return (event) => {
      setRegisterForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage('Confirm password does not match')
      return
    }

    const result = await requestJson(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: registerForm.email,
        username: registerForm.username,
        country: registerForm.country,
        password: registerForm.password,
      }),
    })

    if (!result.ok) {
      setMessage(result.data.message || `Register failed (${result.status})`)
      return
    }

    // Auto-login after register so user lands on Create Room page.
    const loginResult = await requestJson(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: registerForm.email,
        password: registerForm.password,
      }),
    })

    if (!loginResult.ok) {
      setMessage('Register successful. Please login.')
      setMode('login')
      setLoginForm((prev) => ({ ...prev, email: registerForm.email }))
      setRegisterForm(initialRegisterForm)
      return
    }

    const token = loginResult.data?.token
    const user = loginResult.data?.user

    if (!token || !user) {
      setMessage('Register successful. Please login.')
      setMode('login')
      setLoginForm((prev) => ({ ...prev, email: registerForm.email }))
      setRegisterForm(initialRegisterForm)
      return
    }

    saveToken(token)
    verifyProtectedSession(user?._id)

    if (onAuthSuccess) {
      onAuthSuccess(user, { openCreate: true })
    }
    setMessage('Register successful')
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setMessage('')

    const result = await requestJson(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: loginForm.email,
        password: loginForm.password,
      }),
    })

    if (!result.ok) {
      setMessage(result.data.message || `Login failed (${result.status})`)
      return
    }

    const token = result.data?.token
    const user = result.data?.user

    if (!token || !user) {
      setMessage('Login failed: server response missing token/user')
      return
    }

    saveToken(token)
    verifyProtectedSession(user?._id)

    if (onAuthSuccess) {
      onAuthSuccess(user, { openCreate: false })
    }
    setMessage('Login successful')
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <header className="auth-header">
          <div className="auth-head-row">
            <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>
            {onClose ? (
              <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
                X
              </button>
            ) : null}
          </div>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Sign in with your account details.'
              : 'Create a new account to get started.'}
          </p>
        </header>

        {message ? <p className="auth-message">{message}</p> : null}

        <div className="auth-toggle" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label>
              Email or Username
              <input
                type="text"
                placeholder="you@example.com or username"
                value={loginForm.email}
                onChange={updateLoginField('email')}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={updateLoginField('password')}
              />
            </label>
            <button type="submit">Login</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <label>
              Email
              <input
                type="email"
                placeholder="you@example.com"
                value={registerForm.email}
                onChange={updateRegisterField('email')}
              />
            </label>
            <label>
              Username
              <input
                type="text"
                placeholder="Username"
                value={registerForm.username}
                onChange={updateRegisterField('username')}
              />
            </label>
            <label>
              Country
              <div className="country-picker">
                <select
                  value={registerForm.country}
                  onChange={updateRegisterField('country')}
                >
                  <option value="">Select country</option>
                  {filteredCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder="Create a password"
                value={registerForm.password}
                onChange={updateRegisterField('password')}
              />
              <span className="auth-hint">
                Min 8 chars · uppercase · number · special ($&nbsp;#&nbsp;@&nbsp;!)
              </span>
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                placeholder="Confirm your password"
                value={registerForm.confirmPassword}
                onChange={updateRegisterField('confirmPassword')}
              />
            </label>
            <button type="submit">Register</button>
          </form>
        )}
      </section>
    </main>
  )
}

export default AuthForm
