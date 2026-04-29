import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import CourseSidebar from '@/components/CourseSidebar';
import AssessmentForm from '@/components/AssessmentForm';
import {
  getCourseWithModuleItems,
  getAssessmentBySlug,
  getSessionUser,
  getUserEnrollment,
  getUserAssessmentScores,
} from '@/lib/supabase/queries';
import type { ModuleItem } from '@/lib/supabase/queries';

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ slug: string; assessmentSlug: string }>;
}) {
  const { slug, assessmentSlug } = await params;

  // Auth gate
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect(`/auth/login?next=/courses/${slug}/assessments/${assessmentSlug}`);
  }

  // Fetch course with unified items
  const courseData = await getCourseWithModuleItems(slug);
  if (!courseData) notFound();

  // Enrollment check — must have active enrollment
  const enrollment = await getUserEnrollment(sessionUser.uid, courseData.id);

  if (!enrollment || enrollment.status !== 'active') {
    redirect(`/courses/${slug}`);
  }

  // Fetch the assessment with full question data
  const assessmentData = await getAssessmentBySlug(slug, assessmentSlug);
  if (!assessmentData) notFound();

  const { assessment } = assessmentData;

  // Find current module
  const currentModule = courseData.modules.find(
    (m) => m.id === assessment.module_id
  );

  // Build flat items list for prev/next navigation
  const allItems: (ModuleItem & { moduleTitle: string })[] = [];
  courseData.modules.forEach((m) => {
    m.items.forEach((item) => {
      allItems.push({ ...item, moduleTitle: m.title });
    });
  });

  const currentIdx = allItems.findIndex(
    (item) => item.kind === 'assessment' && item.slug === assessmentSlug
  );

  let prevItem: { slug: string; title: string; kind: 'lesson' | 'assessment' } | null = null;
  let nextItem: { slug: string; title: string; kind: 'lesson' | 'assessment' } | null = null;

  if (currentIdx > 0) {
    const prev = allItems[currentIdx - 1];
    prevItem = { slug: prev.slug, title: prev.title, kind: prev.kind };
  }
  if (currentIdx < allItems.length - 1) {
    const next = allItems[currentIdx + 1];
    nextItem = { slug: next.slug, title: next.title, kind: next.kind };
  }

  const progressPercent = allItems.length > 0 ? ((currentIdx + 1) / allItems.length) * 100 : 0;

  // Get assessment scores for sidebar
  const assessmentIds = allItems
    .filter((item) => item.kind === 'assessment')
    .map((item) => item.id);
  const assessmentScores = await getUserAssessmentScores(sessionUser.uid, assessmentIds);

  // Strip correct_answer and rubric from questions before passing to client
  const safeQuestions = (assessment.questions as Array<Record<string, unknown>>).map((q) => {
    const { correct_answer, rubric, ...safeQ } = q;
    return safeQ;
  });

  const typeLabel = assessment.type === 'test' ? 'Module Test' : assessment.type === 'assignment' ? 'Assignment' : 'Quiz';

  function getItemHref(item: { slug: string; kind: 'lesson' | 'assessment' }) {
    return item.kind === 'lesson'
      ? `/courses/${slug}/lessons/${item.slug}`
      : `/courses/${slug}/assessments/${item.slug}`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-ops-background lg:flex-row">
      {/* Sidebar */}
      <CourseSidebar
        course={{ title: courseData.title, slug: courseData.slug }}
        modules={courseData.modules}
        activeSlug={assessmentSlug}
        activeKind="assessment"
        progressPercent={progressPercent}
        currentIdx={currentIdx}
        totalItems={allItems.length}
        assessmentScores={assessmentScores}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar (mobile) */}
        <div className="flex min-h-[56px] items-center gap-3 border-b border-ops-border px-6 py-4 lg:hidden">
          <Link
            href={`/courses/${slug}`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary"
            aria-label="Back to course"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
              {currentModule?.title ? `// ${currentModule.title.toUpperCase()}` : ''}
            </p>
            <p className="truncate font-heading text-sm font-medium text-ops-text-primary">
              {assessment.title}
            </p>
          </div>
          <span
            className="font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary"
            style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}
          >
            {currentIdx + 1}/{allItems.length}
          </span>
        </div>

        {/* Assessment content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 lg:py-16">
            {/* Header */}
            <div className="mb-10">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
                {`// ${typeLabel.toUpperCase()}`}
              </p>
              <h1
                className="mt-2 font-display font-light uppercase text-ops-text-primary"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
              >
                {assessment.title}
              </h1>
              {assessment.description && (
                <p className="mt-3 font-body text-sm leading-relaxed text-ops-text-secondary">
                  {assessment.description}
                </p>
              )}
            </div>

            {/* Assessment form */}
            <AssessmentForm
              assessmentId={assessment.id}
              title={assessment.title}
              instructions={assessment.instructions ?? ''}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              questions={safeQuestions as any}
              assessmentType={assessment.type}
              maxRetakes={assessment.max_retakes}
              passingScore={assessment.passing_score}
              userId={sessionUser.uid}
            />

            {/* Navigation */}
            <div className="mt-16 flex items-center justify-between border-t border-ops-border pt-8">
              {prevItem ? (
                <Link
                  href={getItemHref(prevItem)}
                  className="group flex min-h-[44px] items-center gap-3 text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-left">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                      // PREVIOUS
                    </p>
                    <p className="font-body text-sm">{prevItem.title}</p>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextItem ? (
                <Link
                  href={getItemHref(nextItem)}
                  className="group flex min-h-[44px] items-center gap-3 text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary"
                >
                  <div className="text-right">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                      // NEXT
                    </p>
                    <p className="font-body text-sm">{nextItem.title}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href={`/courses/${slug}`}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[5px] border border-ops-accent bg-transparent px-6 py-3 font-display text-[14px] uppercase tracking-wider text-ops-accent transition-colors duration-150 hover:bg-ops-accent hover:text-ops-background"
                >
                  COURSE COMPLETE
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <polyline points="9 11 12 14 22 4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
