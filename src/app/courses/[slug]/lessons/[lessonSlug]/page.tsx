import { notFound } from 'next/navigation';
import Link from 'next/link';
import LessonPlayer from '@/components/LessonPlayer';
import { getCourseBySlug } from '@/lib/supabase/queries';

interface Module {
  id: string;
  title: string;
  sort_order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  duration_minutes: number | null;
  sort_order: number;
  is_preview: boolean;
}

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
  const course = await getCourseBySlug(slug);

  if (!course) notFound();

  let currentLesson: (Lesson & { content_blocks?: ContentBlock[] }) | null =
    null;
  let currentModule: Module | null = null;
  let prevLesson: { slug: string; title: string } | null = null;
  let nextLesson: { slug: string; title: string } | null = null;

  const allLessons: { lesson: Lesson; module: Module }[] = [];
  course.modules?.forEach((m: Module) => {
    m.lessons?.forEach((l: Lesson) => {
      allLessons.push({ lesson: l, module: m });
    });
  });

  const currentIdx = allLessons.findIndex(
    (item) => item.lesson.slug === lessonSlug
  );
  if (currentIdx === -1) notFound();

  currentLesson = allLessons[currentIdx].lesson;
  currentModule = allLessons[currentIdx].module;

  if (currentIdx > 0) {
    prevLesson = {
      slug: allLessons[currentIdx - 1].lesson.slug,
      title: allLessons[currentIdx - 1].lesson.title,
    };
  }
  if (currentIdx < allLessons.length - 1) {
    nextLesson = {
      slug: allLessons[currentIdx + 1].lesson.slug,
      title: allLessons[currentIdx + 1].lesson.title,
    };
  }

  const progressPercent = ((currentIdx + 1) / allLessons.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-ops-background lg:flex-row">
      {/* Sidebar — module/lesson navigation */}
      <aside className="hidden w-80 shrink-0 border-r border-ops-border bg-ops-surface lg:flex lg:flex-col">
        {/* Course title */}
        <div className="border-b border-ops-border px-6 py-5">
          <Link
            href={`/courses/${slug}`}
            className="flex items-center gap-2 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary transition-colors hover:text-ops-text-primary"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M10 13L5 8L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
              {currentIdx + 1}/{allLessons.length}
            </span>
          </div>
        </div>

        {/* Module list */}
        <nav className="flex-1 overflow-y-auto py-3">
          {course.modules?.map((module: Module, moduleIdx: number) => (
            <div key={module.id} className="mb-2">
              <div className="px-6 py-2 font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
                Module {moduleIdx + 1}: {module.title}
              </div>
              {module.lessons?.map((lesson: Lesson, lessonIdx: number) => {
                const isActive = lesson.slug === lessonSlug;
                return (
                  <Link
                    key={lesson.id}
                    href={`/courses/${slug}/lessons/${lesson.slug}`}
                    className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'border-l-2 border-ops-accent bg-ops-accent/[0.05] text-ops-accent'
                        : 'border-l-2 border-transparent text-ops-text-secondary hover:bg-ops-surface-elevated hover:text-ops-text-primary'
                    }`}
                  >
                    <span className="shrink-0 font-caption text-[10px]">
                      {moduleIdx + 1}.{lessonIdx + 1}
                    </span>
                    <span className="flex-1 truncate font-body text-sm font-light">
                      {lesson.title}
                    </span>
                    {lesson.duration_minutes && (
                      <span className="shrink-0 font-caption text-[10px] text-ops-text-secondary">
                        {lesson.duration_minutes}m
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar (mobile) */}
        <div className="flex items-center gap-3 border-b border-ops-border px-6 py-4 lg:hidden">
          <Link
            href={`/courses/${slug}`}
            className="text-ops-text-secondary transition-colors hover:text-ops-text-primary"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 13L5 8L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div className="flex-1">
            <p className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
              {currentModule?.title}
            </p>
            <p className="truncate font-heading text-sm font-medium text-ops-text-primary">
              {currentLesson.title}
            </p>
          </div>
          <span className="font-caption text-[10px] tracking-[0.1em] text-ops-text-secondary">
            {currentIdx + 1}/{allLessons.length}
          </span>
        </div>

        {/* Lesson content */}
        <LessonPlayer
          lesson={currentLesson}
          moduleName={currentModule?.title ?? ''}
          courseSlug={slug}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
        />
      </div>
    </div>
  );
}
