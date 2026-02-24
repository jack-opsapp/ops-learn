'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from '@/lib/firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from 'firebase/auth';

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const unsubscribe = onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  // Click-outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    await signOut();
    await fetch('/api/auth/session', { method: 'DELETE' });
    setDropdownOpen(false);
    router.push('/');
    router.refresh();
  };

  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

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

        {/* Nav links + auth */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="hidden font-caption uppercase tracking-[0.15em] text-[11px] text-ops-text-secondary transition-colors hover:text-ops-text-primary sm:block"
          >
            Courses
          </Link>

          {authLoading ? null : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="font-body text-ops-text-primary text-sm underline underline-offset-4 decoration-ops-border hover:decoration-ops-border-hover transition-colors cursor-pointer"
              >
                {userName}
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-2 w-48 bg-ops-surface border border-ops-border rounded-[3px] overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-ops-border">
                      <p className="font-caption text-ops-text-secondary uppercase tracking-[0.1em] text-[10px]">
                        SIGNED IN AS
                      </p>
                      <p className="font-body text-ops-text-primary text-sm mt-1 truncate">
                        {userName}
                      </p>
                    </div>
                    <a
                      href="https://app.opsapp.co"
                      className="block px-4 py-2.5 font-caption text-ops-text-secondary uppercase tracking-[0.1em] text-[11px] hover:bg-ops-surface-elevated hover:text-ops-text-primary transition-colors"
                    >
                      OPS DASHBOARD
                    </a>
                    <Link
                      href="/my-courses"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 font-caption text-ops-text-secondary uppercase tracking-[0.1em] text-[11px] hover:bg-ops-surface-elevated hover:text-ops-text-primary transition-colors"
                    >
                      MY COURSES
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 font-caption text-ops-text-secondary uppercase tracking-[0.1em] text-[11px] hover:bg-ops-surface-elevated hover:text-ops-text-primary transition-colors border-t border-ops-border cursor-pointer"
                    >
                      SIGN OUT
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
