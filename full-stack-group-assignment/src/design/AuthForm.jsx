import { useState } from 'react'
import './AuthForm.css'

const API_BASE_URL = 'http://localhost:5000/api/auth'

const initialRegisterForm = {
  email: '',
  username: '',
  country: '',
  password: '',
  confirmPassword: '',
}

function AuthForm() {
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const [registerForm, setRegisterForm] = useState(initialRegisterForm)

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

    const response = await fetch(`${API_BASE_URL}/register`, {
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

    const data = await response.json()

    if (!response.ok) {
      setMessage(data.message || 'Register failed')
      return
    }

    setMessage('Register successful. Please login.')
    setMode('login')
    setLoginForm((prev) => ({ ...prev, email: registerForm.email }))
    setRegisterForm(initialRegisterForm)
  }

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setMessage('')

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: loginForm.email,
        password: loginForm.password,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      setMessage(data.message || 'Login failed')
      return
    }

    setMessage('Login successful')
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <header className="auth-header">
          <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>
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
              <input
                type="text"
                placeholder="Country"
                value={registerForm.country}
                onChange={updateRegisterField('country')}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder="Create a password"
                value={registerForm.password}
                onChange={updateRegisterField('password')}
              />
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
