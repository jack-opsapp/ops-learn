'use client';

import { useState } from 'react';
import type { ModuleDetail } from '@/lib/admin/types';

function TypePill({ type }: { type: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-[2px] bg-ops-surface-elevated font-caption text-[9px] uppercase tracking-[0.1em] text-ops-text-secondary">
      {type}
    </span>
  );
}

function AssessmentTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    quiz: 'text-ops-accent',
    assignment: 'text-ops-warning',
    test: 'text-ops-success',
  };
  return (
    <span className={`font-caption text-[9px] uppercase tracking-[0.1em] ${colors[type] ?? 'text-ops-text-secondary'}`}>
      {type}
    </span>
  );
}

export default function CurriculumTree({ modules }: { modules: ModuleDetail[] }) {
  const [openModules, setOpenModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id))
  );

  function toggle(id: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {modules.map((mod) => {
        const isOpen = openModules.has(mod.id);
        return (
          <div key={mod.id} className="border border-ops-border rounded-[3px] overflow-hidden">
            {/* Module header */}
            <button
              onClick={() => toggle(mod.id)}
              className="w-full flex items-center justify-between px-5 py-4 bg-ops-surface hover:bg-ops-surface-elevated transition-colors cursor-pointer text-left"
            >
              <div>
                <h4 className="font-heading text-sm font-medium text-ops-text-primary">
                  {mod.title}
                </h4>
                <p className="mt-0.5 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">
                  {mod.lessons.length} lessons &middot; {mod.assessments.length} assessments
                </p>
              </div>
              <span className="text-ops-text-secondary text-sm shrink-0 ml-4">
                {isOpen ? '−' : '+'}
              </span>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-ops-border bg-ops-background">
                {/* Lessons */}
                {mod.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between px-5 py-3 border-b border-ops-border last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-ops-text-primary truncate">
                        {lesson.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {lesson.duration_minutes && (
                          <span className="font-caption text-[10px] text-ops-text-secondary">
                            {lesson.duration_minutes} min
                          </span>
                        )}
                        {lesson.content_blocks.map((cb, i) => (
                          <TypePill key={i} type={cb.type} />
                        ))}
                      </div>
                    </div>
                    <span className="ml-4 font-caption text-[9px] uppercase tracking-[0.1em] text-ops-text-secondary shrink-0">
                      Lesson
                    </span>
                  </div>
                ))}

                {/* Assessments */}
                {mod.assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between px-5 py-3 border-b border-ops-border last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-ops-text-primary truncate">
                        {assessment.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <AssessmentTypeBadge type={assessment.type} />
                        {assessment.passing_score !== null && (
                          <span className="font-caption text-[10px] text-ops-text-secondary">
                            Pass: {assessment.passing_score}%
                          </span>
                        )}
                        <span className="font-caption text-[10px] text-ops-text-secondary">
                          {assessment.question_count} questions
                        </span>
                      </div>
                    </div>
                    <span className="ml-4 font-caption text-[9px] uppercase tracking-[0.1em] text-ops-accent shrink-0">
                      Assessment
                    </span>
                  </div>
                ))}

                {mod.lessons.length === 0 && mod.assessments.length === 0 && (
                  <p className="px-5 py-4 font-caption text-[11px] text-ops-text-secondary">
                    No content in this module.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
