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
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-150 ${
        scrolled
          ? 'border-b border-white/[0.09]'
          : 'bg-transparent border-b border-transparent'
      }`}
      style={
        scrolled
          ? {
              background: 'rgba(18, 18, 20, 0.78)',
              backdropFilter: 'blur(28px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
            }
          : undefined
      }
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
        {/* Logo */}
        <Link href="/" className="flex min-h-[44px] items-center gap-3">
          <span className="font-display text-[20px] font-light tracking-wider text-ops-text-primary">
            OPS
          </span>
          <span className="font-mono uppercase tracking-wider text-[11px] text-ops-text-tertiary">
            LEARN
          </span>
        </Link>

        {/* Nav links + auth */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="hidden min-h-[44px] items-center font-display uppercase tracking-wider text-[12px] text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary sm:inline-flex"
          >
            COURSES
          </Link>

          {authLoading ? null : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="min-h-[44px] px-2 font-body text-ops-text-primary text-sm underline underline-offset-4 decoration-ops-border hover:decoration-ops-border-hover transition-colors duration-150 cursor-pointer"
              >
                {userName}
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="glass-dense absolute right-0 top-full mt-2 w-56 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.09)]">
                      <p className="font-mono text-ops-text-tertiary uppercase tracking-wider text-[11px]">
                        // OPERATOR
                      </p>
                      <p className="font-body text-ops-text-primary text-sm mt-1 truncate">
                        {userName}
                      </p>
                    </div>
                    <a
                      href="https://app.opsapp.co"
                      className="block min-h-[44px] px-4 py-3 font-display text-ops-text-secondary uppercase tracking-wider text-[12px] hover:bg-[rgba(255,255,255,0.05)] hover:text-ops-text-primary transition-colors duration-150"
                    >
                      OPS DASHBOARD
                    </a>
                    <Link
                      href="/my-courses"
                      onClick={() => setDropdownOpen(false)}
                      className="block min-h-[44px] px-4 py-3 font-display text-ops-text-secondary uppercase tracking-wider text-[12px] hover:bg-[rgba(255,255,255,0.05)] hover:text-ops-text-primary transition-colors duration-150"
                    >
                      MY COURSES
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left min-h-[44px] px-4 py-3 font-display text-ops-text-secondary uppercase tracking-wider text-[12px] hover:bg-[rgba(255,255,255,0.05)] hover:text-ops-text-primary transition-colors duration-150 border-t border-[rgba(255,255,255,0.09)] cursor-pointer"
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
              className="inline-flex min-h-[44px] items-center justify-center font-display uppercase tracking-wider text-[14px] px-6 py-2 rounded-[5px] transition-colors duration-150 bg-transparent text-ops-text-primary border border-ops-border hover:border-ops-border-hover hover:bg-[rgba(255,255,255,0.05)] active:bg-[rgba(255,255,255,0.08)]"
            >
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
