'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const isCoursesActive = pathname === '/admin' || pathname.startsWith('/admin/courses');

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-ops-surface border-r border-ops-border flex flex-col z-30">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="font-heading text-lg font-bold tracking-wide text-ops-text-primary">
            OPS
          </span>
          <span className="font-caption text-[10px] uppercase tracking-[0.2em] text-ops-text-secondary">
            Admin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3">
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-[3px] font-caption text-[11px] uppercase tracking-[0.15em] transition-colors ${
            isCoursesActive
              ? 'text-ops-text-primary bg-ops-surface-elevated border-l-2 border-ops-accent'
              : 'text-ops-text-secondary hover:text-ops-text-primary hover:bg-ops-surface-elevated'
          }`}
        >
          Courses
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2.5 font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary hover:text-ops-text-primary transition-colors"
        >
          <span className="text-sm">&larr;</span>
          Back to Site
        </Link>
      </div>
    </aside>
  );
}
