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
        <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary">
          Your Score
        </p>
        <p
          className="mt-2 font-heading font-bold text-ops-text-primary"
          style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', lineHeight: 1 }}
        >
          {score}%
        </p>
        <p className="mt-3 font-body text-base font-light text-ops-text-secondary">
          {tierMessage}
        </p>
      </div>

      {/* Discount CTA */}
      {discountPercentage > 0 && (
        <div className="mb-10 rounded-[3px] border border-ops-accent/30 bg-ops-accent/5 p-6 text-center">
          <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-accent">
            You earned {discountPercentage}% off
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-ops-text-primary">
            <span className="text-ops-text-secondary/40 line-through">
              ${(priceCents / 100).toFixed(0)}
            </span>{' '}
            ${(discountedPrice / 100).toFixed(0)}
          </p>
          <button
            onClick={handleBuyWithDiscount}
            disabled={buyLoading}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-[3px] bg-ops-text-primary px-8 py-3 font-caption text-xs uppercase tracking-[0.15em] text-ops-background transition-all duration-200 hover:bg-white/90 active:bg-white/80 disabled:opacity-50"
          >
            {buyLoading ? 'Redirecting...' : `Buy Course — $${(discountedPrice / 100).toFixed(0)}`}
          </button>
          {buyError && <p className="mt-2 font-body text-sm text-red-400">{buyError}</p>}
        </div>
      )}

      {/* Per-question feedback */}
      <div className="flex flex-col gap-4">
        <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary">
          [ Question Breakdown ]
        </p>
        {feedback.map((fb, idx) => {
          const question = questions.find((q) => q.id === fb.questionId);
          return (
            <div
              key={fb.questionId}
              className="rounded-[3px] border border-ops-border bg-ops-surface p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-body text-sm text-ops-text-primary">
                  <span className="mr-2 font-caption text-[10px] text-ops-text-secondary">
                    Q{idx + 1}
                  </span>
                  {question?.question}
                </p>
                <span
                  className={`shrink-0 rounded-[3px] px-2 py-0.5 font-caption text-[10px] uppercase tracking-[0.1em] ${
                    fb.score === fb.maxPoints
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : fb.score > 0
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {fb.score}/{fb.maxPoints}
                </span>
              </div>
              <p className="mt-2 font-body text-xs font-light leading-relaxed text-ops-text-secondary">
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
          className="font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary transition-colors hover:text-ops-text-primary"
        >
          &larr; Back to Course
        </a>
      </div>
    </div>
  );
}
