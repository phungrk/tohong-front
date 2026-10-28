import { lazy, Suspense } from 'react'
import App from './App.jsx'
import { AuthGate } from './AuthGate.jsx'

// Có publishable key → dùng login Clerk thật; trống → fallback dev bypass.
const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

// Trang admin mở bằng /?admin (spec 002, research R9). Nạp bằng import() động (bundler có thể gộp chunk);
// không đi qua AuthGate nên không có guest và không chạy analytics.
const isAdminRoute = new URLSearchParams(window.location.search).has('admin')
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

export default function Root() {
  if (isAdminRoute) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    )
  }
  return clerkEnabled ? <AuthGate /> : <App />
}
