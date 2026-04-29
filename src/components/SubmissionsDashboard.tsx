'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Submission {
  id: string;
  assessment_id: string;
  attempt_number: number;
  score: number | null;
  status: string;
  created_at: string;
  graded_at: string | null;
  assessments: {
    id: string;
    title: string;
    type: 'quiz' | 'assignment' | 'test';
    slug: string;
    modules: {
      id: string;
      title: string;
      courses: {
        id: string;
        title: string;
        slug: string;
      };
    };
  };
}

interface CourseGroup {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  assessments: AssessmentGroup[];
}

interface AssessmentGroup {
  assessmentId: string;
  title: string;
  type: 'quiz' | 'assignment' | 'test';
  slug: string;
  moduleTitle: string;
  courseSlug: string;
  bestScore: number | null;
  totalAttempts: number;
  lastSubmitted: string;
  submissions: Submission[];
}

function groupSubmissions(submissions: Submission[]): CourseGroup[] {
  const courseMap = new Map<string, CourseGroup>();
  const assessmentMap = new Map<string, AssessmentGroup>();

  for (const sub of submissions) {
    const course = sub.assessments.modules.courses;
    const assessment = sub.assessments;
    const module = sub.assessments.modules;

    if (!courseMap.has(course.id)) {
      courseMap.set(course.id, {
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        assessments: [],
      });
    }

    const key = `${course.id}:${assessment.id}`;
    if (!assessmentMap.has(key)) {
      const group: AssessmentGroup = {
        assessmentId: assessment.id,
        title: assessment.title,
        type: assessment.type,
        slug: assessment.slug,
        moduleTitle: module.title,
        courseSlug: course.slug,
        bestScore: null,
        totalAttempts: 0,
        lastSubmitted: sub.created_at,
        submissions: [],
      };
      assessmentMap.set(key, group);
      courseMap.get(course.id)!.assessments.push(group);
    }

    const group = assessmentMap.get(key)!;
    group.submissions.push(sub);
    group.totalAttempts++;

    if (sub.score !== null && (group.bestScore === null || sub.score > group.bestScore)) {
      group.bestScore = sub.score;
    }

    if (sub.created_at > group.lastSubmitted) {
      group.lastSubmitted = sub.created_at;
    }
  }

  return Array.from(courseMap.values());
}

function TypeBadge({ type }: { type: 'quiz' | 'assignment' | 'test' }) {
  const labels = { quiz: 'QUIZ', assignment: 'ASSIGNMENT', test: 'MODULE TEST' };
  return (
    <span className="rounded-[4px] border border-ops-border bg-[rgba(255,255,255,0.05)] px-2 py-[2px] font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
      {labels[type]}
    </span>
  );
}

function ScoreDisplay({ score }: { score: number | null }) {
  if (score === null) return <span className="text-ops-text-tertiary">—</span>;

  const color =
    score >= 80 ? 'text-ops-success' : score >= 50 ? 'text-ops-warning' : 'text-ops-rose';

  return (
    <span
      className={`font-mono text-lg font-medium ${color}`}
      style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
    >
      {score}%
    </span>
  );
}

export default function SubmissionsDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/assessments/submissions?all=true');
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data.submissions ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-ops-text-secondary border-t-transparent" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="glass-surface px-8 py-16 text-center">
        <span className="font-display text-5xl font-light tracking-wider text-white/[0.04]" aria-hidden="true">OPS</span>
        <h2 className="mt-4 font-display text-xl font-light uppercase text-ops-text-primary">
          NO SUBMISSIONS YET
        </h2>
        <p className="mt-2 font-body text-sm text-ops-text-secondary">
          Complete quizzes, assignments, and tests to see them here.
        </p>
      </div>
    );
  }

  const courseGroups = groupSubmissions(submissions);

  return (
    <div className="space-y-8">
      {courseGroups.map((courseGroup) => (
        <div key={courseGroup.courseId}>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
            {`// ${courseGroup.courseTitle.toUpperCase()}`}
          </p>

          <div className="space-y-2">
            {courseGroup.assessments.map((assessment) => {
              const isExpanded = expandedAssessment === assessment.assessmentId;

              return (
                <div
                  key={assessment.assessmentId}
                  className="glass-surface overflow-hidden"
                >
                  {/* Assessment row */}
                  <button
                    onClick={() =>
                      setExpandedAssessment(isExpanded ? null : assessment.assessmentId)
                    }
                    className="flex min-h-[44px] w-full items-center gap-4 px-5 py-4 text-left cursor-pointer transition-colors duration-150 hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm text-ops-text-primary">
                          {assessment.title}
                        </span>
                        <TypeBadge type={assessment.type} />
                      </div>
                      <p className="mt-0.5 font-caption text-[11px] text-ops-text-secondary">
                        {assessment.moduleTitle} · {assessment.totalAttempts} attempt{assessment.totalAttempts !== 1 ? 's' : ''} · Last{' '}
                        {new Date(assessment.lastSubmitted).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <ScoreDisplay score={assessment.bestScore} />

                    <Link
                      href={`/courses/${assessment.courseSlug}/assessments/${assessment.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 inline-flex min-h-[44px] items-center rounded-[5px] border border-ops-border px-3 py-1.5 font-display text-[11px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-150 hover:border-ops-border-hover hover:text-ops-text-primary"
                    >
                      {assessment.totalAttempts < 3 ? 'RETAKE' : 'VIEW'}
                    </Link>

                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`shrink-0 text-ops-text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Expanded: individual attempts */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-ops-border">
                          {assessment.submissions
                            .sort((a, b) => a.attempt_number - b.attempt_number)
                            .map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center gap-4 border-b border-ops-border px-5 py-3 last:border-b-0"
                              >
                                <span className="font-caption text-[11px] text-ops-text-secondary">
                                  Attempt {sub.attempt_number}
                                </span>
                                <span className="font-caption text-[11px] text-ops-text-tertiary">
                                  {new Date(sub.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <span className="ml-auto">
                                  {sub.status === 'graded' && sub.score !== null ? (
                                    <span
                                      className={`font-mono text-sm ${
                                        sub.score >= 80
                                          ? 'text-ops-success'
                                          : sub.score >= 50
                                            ? 'text-ops-warning'
                                            : 'text-ops-rose'
                                      }`}
                                      style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
                                    >
                                      {sub.score}%
                                    </span>
                                  ) : (
                                    <span className="font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                                      {sub.status.toUpperCase()}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
