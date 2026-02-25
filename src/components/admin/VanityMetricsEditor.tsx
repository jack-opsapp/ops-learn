'use client';

import { useState, useTransition } from 'react';
import { updateVanityMetrics } from '@/lib/admin/actions';
import type { VanityMetrics } from '@/lib/admin/types';

interface Props {
  courseId: string;
  initial: VanityMetrics;
}

export default function VanityMetricsEditor({ courseId, initial }: Props) {
  const [metrics, setMetrics] = useState<VanityMetrics>(initial);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateVanityMetrics(courseId, metrics);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Saved' });
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to save' });
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Display Enrollments */}
        <div>
          <label className="block font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary mb-2">
            Display Enrollments
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={metrics.display_enrollments}
            onChange={(e) => setMetrics({ ...metrics, display_enrollments: parseInt(e.target.value) || 0 })}
            className="w-full bg-ops-surface border border-ops-border px-4 py-3 rounded-[3px] text-ops-text-primary font-body text-sm focus:outline-none focus:border-ops-accent transition-colors"
          />
        </div>

        {/* Display Rating */}
        <div>
          <label className="block font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary mb-2">
            Display Rating
          </label>
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={metrics.display_rating}
            onChange={(e) => setMetrics({ ...metrics, display_rating: parseFloat(e.target.value) || 0 })}
            className="w-full bg-ops-surface border border-ops-border px-4 py-3 rounded-[3px] text-ops-text-primary font-body text-sm focus:outline-none focus:border-ops-accent transition-colors"
          />
        </div>

        {/* Display Review Count */}
        <div>
          <label className="block font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary mb-2">
            Display Review Count
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={metrics.display_review_count}
            onChange={(e) => setMetrics({ ...metrics, display_review_count: parseInt(e.target.value) || 0 })}
            className="w-full bg-ops-surface border border-ops-border px-4 py-3 rounded-[3px] text-ops-text-primary font-body text-sm focus:outline-none focus:border-ops-accent transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-ops-accent text-white font-caption uppercase tracking-[0.15em] text-xs px-6 py-3 rounded-[3px] transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>

        {feedback && (
          <span
            className={`font-caption text-[11px] ${
              feedback.type === 'success' ? 'text-ops-success' : 'text-red-400'
            }`}
          >
            {feedback.message}
          </span>
        )}
      </div>
    </div>
  );
}
