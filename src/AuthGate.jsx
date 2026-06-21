import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  useAuth,
  useUser,
} from '@clerk/clerk-react';
import { useEffect } from 'react';
import App from './App.jsx';
import { setTokenProvider } from './api.js';
import { identify } from './analytics.js';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AuthGate() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <AuthedApp />
      </SignedIn>
    </ClerkProvider>
  );
}

function SignInScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <SignIn />
    </div>
  );
}

function AuthedApp() {
  const { getToken } = useAuth();
  const { isLoaded, user } = useUser();

  setTokenProvider(() => getToken());

  useEffect(() => {
    if (isLoaded && user) {
      identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
      });
    }
  }, [isLoaded, user]);

  if (!isLoaded) return null;

  return <App />;
}
