'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-ops-border bg-ops-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold tracking-wide text-ops-text-primary">
            OPS
          </span>
          <span className="font-caption text-xs font-normal uppercase tracking-widest text-ops-accent">
            Learn
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="font-caption text-sm text-ops-text-secondary transition-colors hover:text-ops-text-primary"
          >
            Courses
          </Link>
          <Link
            href="https://opsapp.co"
            target="_blank"
            className="rounded-ops-lg border border-ops-border px-4 py-1.5 font-caption text-sm text-ops-text-secondary transition-colors hover:border-ops-accent hover:text-ops-text-primary"
          >
            OPS App
          </Link>
        </nav>
      </div>
    </header>
  );
}
