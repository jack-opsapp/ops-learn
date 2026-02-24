import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { getCourseBySlug } from '@/lib/supabase/queries';

interface Module {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration_minutes: number | null;
  sort_order: number;
  is_preview: boolean;
}

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) notFound();

  const isFree = course.price_cents === 0;
  const totalLessons =
    course.modules?.reduce(
      (acc: number, m: Module) => acc + (m.lessons?.length ?? 0),
      0
    ) ?? 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-16 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 font-caption text-sm text-ops-text-tertiary">
          <Link href="/" className="transition-colors hover:text-ops-accent">
            Courses
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ops-text-secondary">{course.title}</span>
        </nav>

        {/* Course Header */}
        <section className="mb-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-heading text-3xl font-bold text-ops-text-primary sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-3 max-w-2xl font-body text-lg leading-relaxed text-ops-text-secondary">
                {course.description}
              </p>
            </div>
          </div>

          {/* Meta bar */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {isFree ? (
              <span className="rounded-ops-lg bg-ops-success/10 px-3 py-1 font-caption text-sm font-medium text-ops-success">
                FREE
              </span>
            ) : (
              <span className="rounded-ops-lg bg-ops-accent/10 px-3 py-1 font-caption text-sm text-ops-accent">
                ${(course.price_cents / 100).toFixed(0)}
              </span>
            )}
            <span className="font-caption text-sm text-ops-text-tertiary">
              {course.modules?.length ?? 0} modules
            </span>
            <span className="text-ops-border">|</span>
            <span className="font-caption text-sm text-ops-text-tertiary">
              {totalLessons} lessons
            </span>
            {course.estimated_duration_minutes && (
              <>
                <span className="text-ops-border">|</span>
                <span className="font-caption text-sm text-ops-text-tertiary">
                  {course.estimated_duration_minutes} min total
                </span>
              </>
            )}
          </div>

          {/* Start button */}
          {course.modules?.[0]?.lessons?.[0] && (
            <Link
              href={`/courses/${slug}/lessons/${course.modules[0].lessons[0].slug}`}
              className="mt-8 inline-flex items-center gap-2 rounded-ops-lg bg-ops-accent px-6 py-3 font-heading text-base font-semibold text-white transition-colors hover:bg-ops-accent-hover"
            >
              Start Course
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="ml-1"
              >
                <path
                  d="M6 3L11 8L6 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
        </section>

        {/* Curriculum */}
        <section>
          <h2 className="mb-6 font-heading text-2xl font-semibold text-ops-text-primary">
            Curriculum
          </h2>
          <div className="flex flex-col gap-4">
            {course.modules?.map((module: Module, moduleIdx: number) => (
              <div
                key={module.id}
                className="overflow-hidden rounded-ops-xl border border-ops-border bg-ops-surface"
              >
                {/* Module header */}
                <div className="border-b border-ops-border px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ops-accent/10 font-caption text-xs font-medium text-ops-accent">
                      {moduleIdx + 1}
                    </span>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-ops-text-primary">
                        {module.title}
                      </h3>
                      {module.description && (
                        <p className="mt-0.5 font-caption text-xs text-ops-text-tertiary">
                          {module.description}
                        </p>
                      )}
                    </div>
                    <span className="ml-auto font-caption text-xs text-ops-text-tertiary">
                      {module.lessons?.length ?? 0} lessons
                    </span>
                  </div>
                </div>

                {/* Lessons */}
                <div className="divide-y divide-ops-border">
                  {module.lessons?.map(
                    (lesson: Lesson, lessonIdx: number) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${slug}/lessons/${lesson.slug}`}
                        className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-ops-surface-hover"
                      >
                        <span className="font-caption text-xs text-ops-text-tertiary">
                          {moduleIdx + 1}.{lessonIdx + 1}
                        </span>
                        <div className="flex-1">
                          <span className="font-body text-sm text-ops-text-primary group-hover:text-ops-accent">
                            {lesson.title}
                          </span>
                        </div>
                        {lesson.is_preview && !isFree && (
                          <span className="rounded-ops-lg bg-ops-success/10 px-2 py-0.5 font-caption text-[10px] text-ops-success">
                            PREVIEW
                          </span>
                        )}
                        {lesson.duration_minutes && (
                          <span className="font-caption text-xs text-ops-text-tertiary">
                            {lesson.duration_minutes} min
                          </span>
                        )}
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
