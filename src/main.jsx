import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthGate } from './AuthGate.jsx'

// Có publishable key → dùng login Clerk thật; trống → fallback dev bypass.
const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {clerkEnabled ? <AuthGate /> : <App />}
  </StrictMode>,
)
