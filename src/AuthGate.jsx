import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  useAuth,
  useUser,
  useClerk,
} from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import App from './App.jsx';
import { setTokenProvider, resetTokenProvider, getGuestToken, clearGuestToken, api } from './api.js';
import { identify } from './analytics.js';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AuthGate() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AuthRouter />
    </ClerkProvider>
  );
}

function AuthRouter() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <SignedIn>
        <AuthedApp onShowSignIn={() => setShowSignIn(true)} />
      </SignedIn>
      <SignedOut>
        {/* Guest mode — App chạy bình thường với guest token */}
        <GuestApp onShowSignIn={() => setShowSignIn(true)} />
        {showSignIn && (
          <SignInOverlay onClose={() => setShowSignIn(false)} />
        )}
      </SignedOut>
    </>
  );
}

function SignInOverlay({ onClose }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{ position: 'relative' }}>
        <button
          onClick={onClose}
          aria-label="Đóng"
          style={{
            position: 'absolute', top: -12, right: -12, zIndex: 1,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--card)', border: '1px solid var(--line-200)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--ink-600)',
          }}
        >✕</button>
        <SignIn routing="hash" />
      </div>
    </div>
  );
}

function GuestApp({ onShowSignIn }) {
  // Guest dùng token mặc định (đã set trong api.js)
  return <App isGuest onShowSignIn={onShowSignIn} />;
}

function AuthedApp({ onShowSignIn }) {
  const { getToken } = useAuth();
  const { isLoaded, user } = useUser();

  setTokenProvider(() => getToken());

  useEffect(() => {
    if (!isLoaded || !user) return;

    identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName,
    });

    // Di trú dữ liệu guest → Clerk account nếu có guest token
    const guestToken = (() => {
      try { return localStorage.getItem('th_guest_token'); } catch { return null; }
    })();
    if (guestToken) {
      api.claimGuest(guestToken)
        .then(() => clearGuestToken())
        .catch(() => {}); // claim thất bại không block app
    }
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  return <App isGuest={false} onShowSignIn={onShowSignIn} />;
}
