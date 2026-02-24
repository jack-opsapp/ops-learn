'use client';

import { useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onIdTokenChanged } from 'firebase/auth';

/**
 * Keeps the server-side session cookie in sync with the client-side Firebase token.
 * Firebase ID tokens expire after 1 hour; this component refreshes the cookie
 * whenever Firebase issues a new token.
 */
export default function SessionSync() {
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
