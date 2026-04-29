'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
  firstLessonSlug: string | null;
  priceCents: number;
  /** null = not signed in, false = not enrolled, 'purchased' = paid but not added, true = active enrollment */
  enrolled: null | false | 'purchased' | true;
}

const BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[5px] border border-ops-accent bg-transparent px-6 py-3 font-display text-[14px] uppercase tracking-wider text-ops-accent transition-colors duration-150 hover:bg-ops-accent hover:text-ops-background disabled:opacity-50';

export default function EnrollButton({
  courseId,
  courseSlug,
  firstLessonSlug,
  priceCents,
  enrolled,
}: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFree = priceCents === 0;

  // ── Not signed in ──
  if (enrolled === null) {
    return (
      <a
        href={`/auth/login?next=/courses/${courseSlug}`}
        className={BTN}
      >
        {isFree ? 'SIGN IN TO ADD COURSE' : 'SIGN IN TO PURCHASE'}
      </a>
    );
  }

  // ── Active enrollment ──
  if (enrolled === true) {
    return (
      <a
        href={firstLessonSlug ? `/courses/${courseSlug}/lessons/${firstLessonSlug}` : '#'}
        className={BTN}
      >
        CONTINUE COURSE
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    );
  }

  // ── Add Course (free, or paid with 'purchased' status) ──
  async function handleAddCourse() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add course');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (isFree || enrolled === 'purchased') {
    return (
      <div>
        <button onClick={handleAddCourse} disabled={loading} className={BTN}>
          {loading ? 'ADDING…' : 'ADD COURSE'}
        </button>
        {error && <p className="mt-2 font-body text-sm text-ops-rose">{error}</p>}
      </div>
    );
  }

  // ── Buy Course (paid, not yet purchased) ──
  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          successUrl: `${window.location.origin}/courses/${courseSlug}?paid=true`,
          cancelUrl: `${window.location.origin}/courses/${courseSlug}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleBuy} disabled={loading} className={BTN}>
        {loading ? 'REDIRECTING…' : `BUY COURSE — $${(priceCents / 100).toFixed(0)}`}
      </button>
      {error && <p className="mt-2 font-body text-sm text-ops-rose">{error}</p>}
    </div>
  );
}
