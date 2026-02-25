'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from '@/lib/firebase/auth';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await signInWithEmail(email, password);

      if (user.email !== 'jack@opsapp.co') {
        setError('Unauthorized');
        setLoading(false);
        return;
      }

      // SessionSync will pick up the token and POST it to /api/auth/session
      // Give it a moment to sync, then redirect
      await new Promise((r) => setTimeout(r, 1500));
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Invalid credentials');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ops-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="font-heading text-2xl font-bold tracking-wide text-ops-text-primary">
            OPS
          </span>
          <span className="ml-3 font-caption text-[10px] uppercase tracking-[0.2em] text-ops-text-secondary">
            Admin
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-ops-surface border border-ops-border px-4 py-3 rounded-[3px] text-ops-text-primary font-body text-sm focus:outline-none focus:border-ops-accent transition-colors"
              placeholder="jack@opsapp.co"
            />
          </div>

          <div>
            <label className="block font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-ops-surface border border-ops-border px-4 py-3 rounded-[3px] text-ops-text-primary font-body text-sm focus:outline-none focus:border-ops-accent transition-colors"
            />
          </div>

          {error && (
            <p className="font-caption text-[11px] text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ops-accent text-white font-caption uppercase tracking-[0.15em] text-xs px-6 py-3 rounded-[3px] transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
