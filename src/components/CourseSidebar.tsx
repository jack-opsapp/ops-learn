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
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 6.5a1.5 1.5 0 1 1 1.5 1.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" />
    </svg>
  );
}

function AssignmentIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 5.5h4M6 8h4M6 10.5h2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function TestIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 1.5L14 5v6l-6 3.5L2 11V5l6-3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 8l1.5 1.5L10.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;

  const color =
    score >= 80
      ? 'text-ops-success border-ops-success/30'
      : score >= 50
        ? 'text-ops-warning border-ops-warning/30'
        : 'text-ops-accent border-ops-accent/30';

  return (
    <span className={`shrink-0 rounded-[2px] border px-1.5 py-0.5 font-caption text-[9px] tabular-nums ${color}`}>
      {score}%
    </span>
  );
}

function getAssessmentTypeLabel(type: 'quiz' | 'assignment' | 'test') {
  switch (type) {
    case 'quiz': return 'Quiz';
    case 'assignment': return 'Assignment';
    case 'test': return 'Module Test';
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
  let lessonCounter = 0;

  return (
    <aside className="hidden w-80 shrink-0 border-r border-ops-border bg-ops-surface lg:flex lg:flex-col">
      {/* Course title */}
      <div className="border-b border-ops-border px-6 py-5">
        <Link
          href={`/courses/${course.slug}`}
          className="flex items-center gap-2 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary transition-colors hover:text-ops-text-primary"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to course
        </Link>
        <h2 className="mt-3 font-heading text-sm font-medium text-ops-text-primary">
          {course.title}
        </h2>
        {/* Progress */}
        <div className="mt-3 flex items-center gap-3">
          <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-ops-border">
            <div
              className="h-[2px] rounded-full bg-ops-accent transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-caption text-[10px] tracking-[0.1em] text-ops-text-secondary">
            {currentIdx + 1}/{totalItems}
          </span>
        </div>
      </div>

      {/* Module list */}
      <nav className="flex-1 overflow-y-auto py-3">
        {modules.map((module, moduleIdx) => {
          // Reset lesson counter per module for numbering
          let moduleLessonIdx = 0;

          return (
            <div key={module.id} className="mb-2">
              <div className="px-6 py-2 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
                Module {moduleIdx + 1}: {module.title}
              </div>

              {module.items.map((item) => {
                if (item.kind === 'lesson') {
                  moduleLessonIdx++;
                  lessonCounter++;
                  const isActive = activeKind === 'lesson' && item.slug === activeSlug;

                  return (
                    <Link
                      key={item.id}
                      href={`/courses/${course.slug}/lessons/${item.slug}`}
                      className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'border-l-2 border-ops-accent bg-ops-accent/[0.05] text-ops-accent'
                          : 'border-l-2 border-transparent text-ops-text-secondary hover:bg-ops-surface-elevated hover:text-ops-text-primary'
                      }`}
                    >
                      <span className="shrink-0 font-caption text-[10px]">
                        {moduleIdx + 1}.{moduleLessonIdx}
                      </span>
                      <span className="flex-1 truncate font-body text-sm font-light">
                        {item.title}
                      </span>
                      {item.duration_minutes && (
                        <span className="shrink-0 font-caption text-[10px] text-ops-text-secondary">
                          {item.duration_minutes}m
                        </span>
                      )}
                    </Link>
                  );
                }

                // Assessment item
                const isActive = activeKind === 'assessment' && item.slug === activeSlug;
                const score = assessmentScores?.[item.id] ?? null;
                const isTest = item.type === 'test';

                return (
                  <Link
                    key={item.id}
                    href={`/courses/${course.slug}/assessments/${item.slug}`}
                    className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'border-l-2 border-ops-accent bg-ops-accent/[0.05] text-ops-accent'
                        : isTest
                          ? 'border-l-2 border-transparent text-ops-text-primary/80 hover:bg-ops-surface-elevated hover:text-ops-text-primary'
                          : 'border-l-2 border-transparent text-ops-text-secondary hover:bg-ops-surface-elevated hover:text-ops-text-primary'
                    }`}
                  >
                    <span className="shrink-0">
                      {getAssessmentIcon(item.type, isActive ? 'text-ops-accent' : 'text-ops-text-secondary')}
                    </span>
                    <span className={`flex-1 truncate font-body text-sm ${isTest ? 'font-normal' : 'font-light'}`}>
                      {item.title}
                    </span>
                    {score !== null ? (
                      <ScoreBadge score={score} />
                    ) : (
                      <span className="shrink-0 font-caption text-[9px] uppercase tracking-[0.1em] text-ops-text-secondary/50">
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
