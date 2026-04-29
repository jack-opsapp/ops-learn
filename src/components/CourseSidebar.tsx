'use client';

import Link from 'next/link';
import type { ModuleItem } from '@/lib/supabase/queries';

interface ModuleWithItems {
  id: string;
  title: string;
  sort_order: number;
  items: ModuleItem[];
}

interface CourseSidebarProps {
  course: { title: string; slug: string };
  modules: ModuleWithItems[];
  activeSlug: string;
  activeKind: 'lesson' | 'assessment';
  progressPercent: number;
  currentIdx: number;
  totalItems: number;
  assessmentScores?: Record<string, number | null>;
}

// Icons for assessment types
function QuizIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 6.5a1.5 1.5 0 1 1 1.5 1.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" />
    </svg>
  );
}

function AssignmentIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 5.5h4M6 8h4M6 10.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function TestIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M8 1.5L14 5v6l-6 3.5L2 11V5l6-3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 8l1.5 1.5L10.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;

  const style =
    score >= 80
      ? { color: '#9DB582', background: 'rgba(157,181,130,0.12)', border: '1px solid rgba(157,181,130,0.30)' }
      : score >= 50
        ? { color: '#C4A868', background: 'rgba(196,168,104,0.12)', border: '1px solid rgba(196,168,104,0.30)' }
        : { color: '#B58289', background: 'rgba(181,130,137,0.12)', border: '1px solid rgba(181,130,137,0.30)' };

  return (
    <span
      className="shrink-0 rounded-[4px] px-1.5 py-[2px] font-mono text-[11px] tabular-nums"
      style={{ ...style, fontFeatureSettings: '"tnum" 1, "zero" 1' }}
    >
      {score}%
    </span>
  );
}

function getAssessmentTypeLabel(type: 'quiz' | 'assignment' | 'test') {
  switch (type) {
    case 'quiz': return 'QUIZ';
    case 'assignment': return 'ASSIGNMENT';
    case 'test': return 'MODULE TEST';
  }
}

function getAssessmentIcon(type: 'quiz' | 'assignment' | 'test', className?: string) {
  switch (type) {
    case 'quiz': return <QuizIcon className={className} />;
    case 'assignment': return <AssignmentIcon className={className} />;
    case 'test': return <TestIcon className={className} />;
  }
}

export default function CourseSidebar({
  course,
  modules,
  activeSlug,
  activeKind,
  progressPercent,
  currentIdx,
  totalItems,
  assessmentScores,
}: CourseSidebarProps) {
  return (
    <aside className="hidden w-80 shrink-0 border-r border-ops-border bg-[rgba(18,18,20,0.58)] backdrop-blur-[28px] lg:flex lg:flex-col">
      {/* Course title */}
      <div className="border-b border-ops-border px-6 py-5">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex min-h-[44px] items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          BACK TO COURSE
        </Link>
        <h2 className="mt-3 font-heading text-sm font-medium text-ops-text-primary">
          {course.title}
        </h2>
        {/* Progress */}
        <div className="mt-3 flex items-center gap-3">
          <div className="h-[2px] flex-1 overflow-hidden rounded-[2px] bg-ops-border">
            <div
              className="h-[2px] rounded-[2px] bg-ops-text-secondary transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span
            className="font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary"
            style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
          >
            {currentIdx + 1}/{totalItems}
          </span>
        </div>
      </div>

      {/* Module list */}
      <nav className="flex-1 overflow-y-auto py-3">
        {modules.map((module, moduleIdx) => {
          let moduleLessonIdx = 0;

          return (
            <div key={module.id} className="mb-2">
              <div className="px-6 py-2 font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
                {`// MODULE ${moduleIdx + 1} — ${module.title}`}
              </div>

              {module.items.map((item) => {
                if (item.kind === 'lesson') {
                  moduleLessonIdx++;
                  const isActive = activeKind === 'lesson' && item.slug === activeSlug;

                  return (
                    <Link
                      key={item.id}
                      href={`/courses/${course.slug}/lessons/${item.slug}`}
                      className={`flex min-h-[44px] items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-150 ${
                        isActive
                          ? 'border-l-2 border-ops-text-secondary bg-[rgba(255,255,255,0.05)] text-ops-text-primary'
                          : 'border-l-2 border-transparent text-ops-text-secondary hover:bg-[rgba(255,255,255,0.04)] hover:text-ops-text-primary'
                      }`}
                    >
                      <span
                        className="shrink-0 font-mono text-[11px] text-ops-text-tertiary"
                        style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
                      >
                        {moduleIdx + 1}.{moduleLessonIdx}
                      </span>
                      <span className="flex-1 truncate font-body text-sm">
                        {item.title}
                      </span>
                      {item.duration_minutes && (
                        <span
                          className="shrink-0 font-mono text-[11px] text-ops-text-tertiary"
                          style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
                        >
                          {item.duration_minutes}M
                        </span>
                      )}
                    </Link>
                  );
                }

                // Assessment item
                const isActive = activeKind === 'assessment' && item.slug === activeSlug;
                const score = assessmentScores?.[item.id] ?? null;

                return (
                  <Link
                    key={item.id}
                    href={`/courses/${course.slug}/assessments/${item.slug}`}
                    className={`flex min-h-[44px] items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-150 ${
                      isActive
                        ? 'border-l-2 border-ops-text-secondary bg-[rgba(255,255,255,0.05)] text-ops-text-primary'
                        : 'border-l-2 border-transparent text-ops-text-secondary hover:bg-[rgba(255,255,255,0.04)] hover:text-ops-text-primary'
                    }`}
                  >
                    <span className="shrink-0">
                      {getAssessmentIcon(item.type, isActive ? 'text-ops-text-primary' : 'text-ops-text-tertiary')}
                    </span>
                    <span className="flex-1 truncate font-body text-sm">
                      {item.title}
                    </span>
                    {score !== null ? (
                      <ScoreBadge score={score} />
                    ) : (
                      <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                        {getAssessmentTypeLabel(item.type)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
