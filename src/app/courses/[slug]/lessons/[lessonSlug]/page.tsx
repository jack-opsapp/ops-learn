import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import LessonPlayer from '@/components/LessonPlayer';
import CourseSidebar from '@/components/CourseSidebar';
import {
  getCourseWithModuleItems,
  getContentBlocksByLessonId,
  getSessionUser,
  getUserEnrollment,
  getUserAssessmentScores,
} from '@/lib/supabase/queries';
import type { ModuleItem } from '@/lib/supabase/queries';

interface ContentBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  sort_order: number;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;

  // Auth gate
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect(`/auth/login?next=/courses/${slug}/lessons/${lessonSlug}`);
  }

  const courseData = await getCourseWithModuleItems(slug);
  if (!courseData) notFound();

  const isFree = courseData.price_cents === 0;

  // Find the lesson across all modules to check is_preview
  let targetLesson: (ModuleItem & { kind: 'lesson' }) | null = null;
  for (const mod of courseData.modules) {
    for (const item of mod.items) {
      if (item.kind === 'lesson' && item.slug === lessonSlug) {
        targetLesson = item as ModuleItem & { kind: 'lesson' };
        break;
      }
    }
    if (targetLesson) break;
  }
  if (!targetLesson) notFound();

  // Enrollment check — must have active enrollment (or preview lesson)
  const enrollment = await getUserEnrollment(sessionUser.uid, courseData.id);

  if (!enrollment || enrollment.status !== 'active') {
    if (!targetLesson.is_preview) {
      redirect(`/courses/${slug}`);
    }
  }

  // Build flat items list for navigation
  const allItems: (ModuleItem & { moduleTitle: string })[] = [];
  courseData.modules.forEach((m) => {
    m.items.forEach((item) => {
      allItems.push({ ...item, moduleTitle: m.title });
    });
  });

  const currentIdx = allItems.findIndex(
    (item) => item.kind === 'lesson' && item.slug === lessonSlug
  );
  if (currentIdx === -1) notFound();

  const currentModuleTitle = allItems[currentIdx].moduleTitle;

  // Fetch content blocks
  const contentBlocks = await getContentBlocksByLessonId(targetLesson.id);
  const currentLesson = {
    id: targetLesson.id,
    title: targetLesson.title,
    slug: targetLesson.slug,
    duration_minutes: targetLesson.duration_minutes,
    content_blocks: contentBlocks as ContentBlock[],
  };

  // Prev/next traverses unified items list (lessons + assessments)
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

  // Get assessment scores for sidebar badges
  const assessmentIds = allItems
    .filter((item) => item.kind === 'assessment')
    .map((item) => item.id);
  const assessmentScores = await getUserAssessmentScores(sessionUser.uid, assessmentIds);

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
        activeSlug={lessonSlug}
        activeKind="lesson"
        progressPercent={progressPercent}
        currentIdx={currentIdx}
        totalItems={allItems.length}
        assessmentScores={assessmentScores}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar (mobile) */}
        <div className="flex items-center gap-3 border-b border-ops-border px-6 py-4 lg:hidden">
          <Link
            href={`/courses/${slug}`}
            className="text-ops-text-secondary transition-colors hover:text-ops-text-primary"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex-1">
            <p className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
              {currentModuleTitle}
            </p>
            <p className="truncate font-heading text-sm font-medium text-ops-text-primary">
              {currentLesson.title}
            </p>
          </div>
          <span className="font-caption text-[10px] tracking-[0.1em] text-ops-text-secondary">
            {currentIdx + 1}/{allItems.length}
          </span>
        </div>

        {/* Lesson content */}
        <LessonPlayer
          lesson={currentLesson}
          moduleName={currentModuleTitle}
          courseSlug={slug}
          prevLesson={prevItem ? { slug: prevItem.slug, title: prevItem.title, href: getItemHref(prevItem) } : null}
          nextLesson={nextItem ? { slug: nextItem.slug, title: nextItem.title, href: getItemHref(nextItem) } : null}
          userId={sessionUser.uid}
        />
      </div>
    </div>
  );
}
