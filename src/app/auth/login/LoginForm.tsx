'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  signUpWithEmail,
} from '@/lib/firebase/auth';
import type { User } from 'firebase/auth';

function LoadingBars() {
  return (
    <div className="flex items-end justify-center gap-[3px] h-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-ops-text-primary"
          style={{
            animation: `loadingBar 1s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes loadingBar {
          0%, 100% { height: 6px; opacity: 0.4; }
          50% { height: 20px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function setSessionCookie(user: User) {
    const idToken = await user.getIdToken();
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setOauthLoading(provider);
    setError(null);
    try {
      const user =
        provider === 'google'
          ? await signInWithGoogle()
          : await signInWithApple();
      await setSessionCookie(user);
      setNavigating(true);
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
      setOauthLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const user = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);
      await setSessionCookie(user);
      setNavigating(true);
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      // Clean up Firebase error messages
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setError('Invalid email or password.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('An account with this email already exists. Try signing in.');
      } else if (msg.includes('auth/weak-password')) {
        setError('Password must be at least 6 characters.');
      } else {
        setError(msg);
      }
    }

    setLoading(false);
  }

  if (navigating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ops-background px-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-end justify-center gap-[3px] h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-[4px] rounded-full bg-ops-text-primary"
                style={{
                  animation: `loadingBar 1s ease-in-out ${i * 0.12}s infinite`,
                }}
              />
            ))}
            <style jsx>{`
              @keyframes loadingBar {
                0%, 100% { height: 8px; opacity: 0.4; }
                50% { height: 32px; opacity: 1; }
              }
            `}</style>
          </div>
          <p className="font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary">
            Signing you in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ops-background px-6">
      {/* Logo */}
      <Link href="/" className="mb-12 flex items-center gap-3">
        <span className="font-heading text-2xl font-bold tracking-wide text-ops-text-primary">
          OPS
        </span>
        <span className="font-caption uppercase tracking-[0.15em] text-[11px] text-ops-text-secondary">
          Learn
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center font-heading text-xl font-bold uppercase text-ops-text-primary">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h1>
        <p className="mb-8 text-center font-body text-sm font-light text-ops-text-secondary">
          {isSignUp
            ? 'Sign up to access courses'
            : 'Sign in to access your courses'}
        </p>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleOAuth('google')}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-[3px] border border-ops-border bg-ops-surface px-6 py-3 font-caption text-xs uppercase tracking-[0.15em] text-ops-text-primary transition-all duration-200 hover:border-ops-border-hover active:bg-ops-surface-elevated disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {oauthLoading === 'google' ? <LoadingBars /> : 'Continue with Google'}
          </button>

          <button
            onClick={() => handleOAuth('apple')}
            disabled={oauthLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-[3px] border border-ops-border bg-ops-surface px-6 py-3 font-caption text-xs uppercase tracking-[0.15em] text-ops-text-primary transition-all duration-200 hover:border-ops-border-hover active:bg-ops-surface-elevated disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            {oauthLoading === 'apple' ? <LoadingBars /> : 'Continue with Apple'}
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-ops-border" />
          <span className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
            or
          </span>
          <div className="h-px flex-1 bg-ops-border" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-[3px] border border-ops-border bg-ops-surface px-4 py-3 font-body text-sm text-ops-text-primary placeholder:text-ops-text-secondary/50 focus:border-ops-border-hover focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-[3px] border border-ops-border bg-ops-surface px-4 py-3 font-body text-sm text-ops-text-primary placeholder:text-ops-text-secondary/50 focus:border-ops-border-hover focus:outline-none"
          />

          {error && (
            <p className="font-body text-sm text-red-400">{error}</p>
          )}
          {message && (
            <p className="font-body text-sm text-ops-accent">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-[3px] bg-ops-text-primary px-6 py-3 font-caption text-xs uppercase tracking-[0.15em] text-ops-background transition-all duration-200 hover:bg-white/90 active:bg-white/80 disabled:opacity-50"
          >
            {loading
              ? <LoadingBars />
              : isSignUp
                ? 'Sign Up'
                : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setMessage(null);
          }}
          className="mt-6 w-full text-center font-body text-sm font-light text-ops-text-secondary transition-colors hover:text-ops-text-primary"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
