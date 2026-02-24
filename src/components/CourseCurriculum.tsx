'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
  is_preview: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: Lesson[];
}

interface CourseCurriculumProps {
  modules: Module[];
  courseSlug: string;
  priceCents: number;
  courseId: string;
  /** null = not signed in, false = signed in but not enrolled, true = enrolled */
  enrolled: boolean | null;
}

export default function CourseCurriculum({
  modules,
  courseSlug,
  priceCents,
  courseId,
  enrolled,
}: CourseCurriculumProps) {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const isFree = priceCents === 0;
  const hasAccess = enrolled === true || isFree;

  function toggleModule(moduleId: string) {
    setOpenModuleId((prev) => (prev === moduleId ? null : moduleId));
  }

  async function handleBuy() {
    setBuyLoading(true);
    setBuyError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          successUrl: `${window.location.origin}/courses/${courseSlug}?enrolled=true`,
          cancelUrl: `${window.location.origin}/courses/${courseSlug}`,
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

  return (
    <div className="flex flex-col gap-4">
      {modules.map((module, moduleIdx) => {
        const isOpen = openModuleId === module.id;

        return (
          <div
            key={module.id}
            className="overflow-hidden rounded-[3px] border border-ops-border bg-ops-surface transition-[border-color] duration-300 hover:border-ops-border-hover"
          >
            {/* Module header — clickable toggle */}
            <button
              onClick={() => toggleModule(module.id)}
              className="flex w-full items-center gap-4 px-6 py-5 text-left cursor-pointer"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ops-border font-caption text-[10px] text-ops-text-secondary">
                {moduleIdx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-base font-medium text-ops-text-primary">
                  {module.title}
                </h3>
                {module.description && (
                  <p className="mt-0.5 font-body text-xs font-light text-ops-text-secondary line-clamp-1">
                    {module.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary mr-2">
                {module.lessons?.length ?? 0} lessons
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className={`shrink-0 text-ops-text-secondary transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  {/* Module description (full) */}
                  {module.description && (
                    <div className="border-t border-ops-border px-6 py-4">
                      <p className="font-body text-sm font-light leading-relaxed text-ops-text-secondary">
                        {module.description}
                      </p>
                    </div>
                  )}

                  {/* Lessons */}
                  <div className="divide-y divide-ops-border border-t border-ops-border">
                    {module.lessons?.map((lesson, lessonIdx) => {
                      const canAccess =
                        hasAccess || lesson.is_preview;

                      return (
                        <div
                          key={lesson.id}
                          className="px-6 py-4"
                        >
                          <div className="flex items-start gap-4">
                            <span className="mt-0.5 shrink-0 font-caption text-[10px] text-ops-text-secondary">
                              {moduleIdx + 1}.{lessonIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-body text-sm text-ops-text-primary">
                                  {lesson.title}
                                </span>
                                {lesson.is_preview && !isFree && !enrolled && (
                                  <span className="rounded-[3px] border border-ops-accent/30 px-2 py-0.5 font-caption text-[9px] uppercase tracking-[0.1em] text-ops-accent">
                                    Preview
                                  </span>
                                )}
                              </div>
                              {lesson.description && (
                                <p className="mt-1 font-body text-xs font-light leading-relaxed text-ops-text-secondary/70">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            {lesson.duration_minutes && (
                              <span className="mt-0.5 shrink-0 font-caption text-[10px] text-ops-text-secondary">
                                {lesson.duration_minutes} min
                              </span>
                            )}
                          </div>

                          {/* Action button */}
                          {canAccess ? (
                            <div className="mt-3 ml-8">
                              <Link
                                href={`/courses/${courseSlug}/lessons/${lesson.slug}`}
                                className="inline-flex items-center gap-2 rounded-[3px] border border-ops-border px-4 py-2 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary transition-all hover:border-ops-border-hover hover:text-ops-text-primary"
                              >
                                {enrolled ? 'Go to Lesson' : 'Preview Lesson'}
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </Link>
                            </div>
                          ) : (
                            <div className="mt-3 ml-8">
                              {enrolled === null ? (
                                <a
                                  href={`/auth/login?next=/courses/${courseSlug}`}
                                  className="inline-flex items-center gap-2 rounded-[3px] bg-ops-text-primary px-4 py-2 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-background transition-all hover:bg-white/90"
                                >
                                  Sign In to Access
                                </a>
                              ) : (
                                <button
                                  onClick={handleBuy}
                                  disabled={buyLoading}
                                  className="inline-flex items-center gap-2 rounded-[3px] bg-ops-text-primary px-4 py-2 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-background transition-all hover:bg-white/90 disabled:opacity-50 cursor-pointer"
                                >
                                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <rect x="2" y="5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M5 5V3.5a3 3 0 0 1 6 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                  </svg>
                                  {buyLoading
                                    ? 'Redirecting...'
                                    : `Purchase Course — $${(priceCents / 100).toFixed(0)}`}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Buy error */}
      {buyError && (
        <p className="font-body text-sm text-red-400">{buyError}</p>
      )}
    </div>
  );
}
