'use client';

import { useState } from 'react';

interface FeedbackItem {
  questionId: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

interface ChallengeResultsProps {
  courseSlug: string;
  courseId: string;
  courseTitle: string;
  priceCents: number;
  score: number;
  feedback: FeedbackItem[];
  questions: Array<{ id: string; question: string; type: string; options?: string[] }>;
  discountPercentage: number;
  discountCode: string | null;
}

export default function ChallengeResults({
  courseSlug,
  courseId,
  priceCents,
  score,
  feedback,
  questions,
  discountPercentage,
  discountCode,
}: ChallengeResultsProps) {
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const discountedPrice = priceCents * (1 - discountPercentage / 100);

  async function handleBuyWithDiscount() {
    setBuyLoading(true);
    setBuyError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          successUrl: `${window.location.origin}/courses/${courseSlug}?paid=true`,
          cancelUrl: `${window.location.origin}/courses/${courseSlug}/challenge`,
          promoCode: discountCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setBuyError(message);
      setBuyLoading(false);
    }
  }

  // Determine tier message
  let tierMessage = '';
  if (score <= 20) tierMessage = "Good try — let's pump those numbers up";
  else if (score <= 50) tierMessage = 'Room to grow — this course will get you there';
  else if (score <= 75) tierMessage = 'Solid foundation — time to level up';
  else if (score <= 90) tierMessage = "Well done — let's get you the rest of the way";
  else tierMessage = 'Impressive — you really know your stuff';

  return (
    <div>
      {/* Score hero */}
      <div className="mb-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
          // YOUR SCORE
        </p>
        <p
          className="mt-2 font-mono font-light text-ops-text-primary"
          style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', lineHeight: 1, fontFeatureSettings: '"tnum" 1, "zero" 1' }}
        >
          {score}%
        </p>
        <p className="mt-3 font-body text-base text-ops-text-secondary">
          {tierMessage}
        </p>
      </div>

      {/* Discount CTA */}
      {discountPercentage > 0 && (
        <div className="glass-surface mb-10 p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
            {`// EARNED ${discountPercentage}% OFF`}
          </p>
          <p className="mt-1 font-mono text-2xl font-medium text-ops-text-primary" style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}>
            <span className="text-ops-text-mute line-through">
              ${(priceCents / 100).toFixed(0)}
            </span>{' '}
            ${(discountedPrice / 100).toFixed(0)}
          </p>
          <button
            onClick={handleBuyWithDiscount}
            disabled={buyLoading}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[5px] border border-ops-accent bg-transparent px-8 py-3 font-display text-[14px] uppercase tracking-wider text-ops-accent transition-colors duration-150 hover:bg-ops-accent hover:text-ops-background disabled:opacity-50"
          >
            {buyLoading ? 'REDIRECTING…' : `BUY COURSE — $${(discountedPrice / 100).toFixed(0)}`}
          </button>
          {buyError && <p className="mt-2 font-body text-sm text-ops-rose">{buyError}</p>}
        </div>
      )}

      {/* Per-question feedback */}
      <div className="flex flex-col gap-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
          // QUESTION BREAKDOWN
        </p>
        {feedback.map((fb, idx) => {
          const question = questions.find((q) => q.id === fb.questionId);
          const fullCredit = fb.score === fb.maxPoints;
          const partial = fb.score > 0 && !fullCredit;
          const badgeStyle = fullCredit
            ? { color: '#9DB582', background: 'rgba(157,181,130,0.12)', border: '1px solid rgba(157,181,130,0.30)' }
            : partial
              ? { color: '#C4A868', background: 'rgba(196,168,104,0.12)', border: '1px solid rgba(196,168,104,0.30)' }
              : { color: '#B58289', background: 'rgba(181,130,137,0.12)', border: '1px solid rgba(181,130,137,0.30)' };

          return (
            <div key={fb.questionId} className="glass-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="font-body text-sm text-ops-text-primary">
                  <span className="mr-2 font-mono text-[11px] text-ops-text-tertiary">
                    Q{idx + 1}
                  </span>
                  {question?.question}
                </p>
                <span
                  className="shrink-0 rounded-[4px] px-2 py-[2px] font-mono text-[11px] uppercase tracking-wider"
                  style={{ ...badgeStyle, fontFeatureSettings: '"tnum" 1, "zero" 1' }}
                >
                  {fb.score}/{fb.maxPoints}
                </span>
              </div>
              <p className="mt-2 font-body text-xs leading-relaxed text-ops-text-secondary">
                {fb.feedback}
              </p>
            </div>
          );
        })}
      </div>

      {/* Back to course */}
      <div className="mt-8">
        <a
          href={`/courses/${courseSlug}`}
          className="inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary"
        >
          ← BACK TO COURSE
        </a>
      </div>
    </div>
  );
}
