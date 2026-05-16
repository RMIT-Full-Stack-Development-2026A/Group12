export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? ''
export const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH ?? '/api'

export const API_ROOT_URL = API_ORIGIN
  ? `${API_ORIGIN}${API_BASE_PATH}`
  : API_BASE_PATH

export const TOKEN_STORAGE_KEY =
  import.meta.env.VITE_TOKEN_STORAGE_KEY ?? 'auth_token'

export const USER_STORAGE_KEY =
  import.meta.env.VITE_USER_STORAGE_KEY ?? 'auth_user'

export const PUBLIC_APP_URL =
  import.meta.env.VITE_PUBLIC_APP_URL ??
  'https://punctured-affirm-levitate.ngrok-free.dev'

export const FALLBACK_COUNTRIES = [
  'Vietnam',
  'Australia',
  'United States',
  'United Kingdom',
  'Canada',
  'Singapore',
  'Japan',
  'South Korea',
  'India',
  'Germany',
  'France',
  'New Zealand',
  'Laos'
]
