'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a confirmation link.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push(next);
        router.refresh();
      }
    }

    setLoading(false);
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
              ? 'Loading...'
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
