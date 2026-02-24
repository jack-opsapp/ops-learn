'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from '@/lib/firebase/auth';
import type { User } from 'firebase/auth';

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const unsubscribe = onAuthStateChanged((u) => setUser(u));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/[0.08]'
          : 'bg-transparent border-b border-transparent'
      }`}
      style={
        scrolled
          ? {
              background: 'rgba(10, 10, 10, 0.70)',
              backdropFilter: 'blur(20px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
            }
          : undefined
      }
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <span className="font-heading text-xl font-bold tracking-wide text-ops-text-primary">
            OPS
          </span>
          <span className="font-caption uppercase tracking-[0.15em] text-[11px] text-ops-text-secondary">
            Learn
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="hidden font-caption uppercase tracking-[0.15em] text-[11px] text-ops-text-secondary transition-colors hover:text-ops-text-primary sm:block"
          >
            Courses
          </Link>
          {user ? (
            <button
              onClick={async () => {
                await signOut();
                await fetch('/api/auth/session', { method: 'DELETE' });
                router.push('/');
                router.refresh();
              }}
              className="inline-flex items-center justify-center font-caption uppercase tracking-[0.15em] text-xs px-6 py-3 rounded-[3px] transition-all duration-200 bg-transparent text-ops-text-primary border border-ops-border hover:border-ops-border-hover active:border-white/40"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center font-caption uppercase tracking-[0.15em] text-xs px-6 py-3 rounded-[3px] transition-all duration-200 bg-transparent text-ops-text-primary border border-ops-border hover:border-ops-border-hover active:border-white/40"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
