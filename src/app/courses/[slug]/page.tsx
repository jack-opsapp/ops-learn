import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EnrollButton from '@/components/EnrollButton';
import { getCourseBySlug, getAuthUser, getUserEnrollment } from '@/lib/supabase/queries';

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

  const user = await getAuthUser();
  const enrollment = user
    ? await getUserEnrollment(user.id, course.id)
    : null;

  // enrolled: null = not signed in, false = signed in but not enrolled, true = enrolled
  const enrolled = user === null ? null : enrollment !== null;

  const isFree = course.price_cents === 0;
  const totalLessons =
    course.modules?.reduce(
      (acc: number, m: Module) => acc + (m.lessons?.length ?? 0),
      0
    ) ?? 0;

  return (
    <>
      <Header />
      <main className="relative z-10">
        {/* Hero area */}
        <section className="relative px-6 pt-28 pb-12 md:px-10 lg:px-24">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f] via-ops-background to-ops-background" />

          <div className="relative mx-auto max-w-[1400px]">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <div className="flex items-center gap-2 font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary">
                <Link href="/" className="transition-colors hover:text-ops-text-primary">
                  Courses
                </Link>
                <span>/</span>
                <span className="text-ops-text-primary">{course.title}</span>
              </div>
            </nav>

            {/* Course header */}
            <div className="max-w-2xl">
              <h1
                className="font-heading font-bold uppercase text-ops-text-primary"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1 }}
              >
                {course.title}
              </h1>
              <p className="mt-4 font-body text-lg font-light leading-relaxed text-ops-text-secondary">
                {course.description}
              </p>

              {/* Meta bar */}
              <div className="mt-6 flex flex-wrap items-center gap-4 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">
                {isFree ? (
                  <span className="rounded-[3px] bg-ops-accent/10 px-3 py-1 text-ops-accent">
                    Free
                  </span>
                ) : (
                  <span className="rounded-[3px] bg-ops-accent/10 px-3 py-1 text-ops-accent">
                    ${(course.price_cents / 100).toFixed(0)}
                  </span>
                )}
                <span>{course.modules?.length ?? 0} modules</span>
                <span className="text-ops-border">|</span>
                <span>{totalLessons} lessons</span>
                {course.estimated_duration_minutes && (
                  <>
                    <span className="text-ops-border">|</span>
                    <span>{course.estimated_duration_minutes} min total</span>
                  </>
                )}
              </div>

              {/* CTA — enrollment-aware */}
              <div className="mt-8">
                <EnrollButton
                  courseId={course.id}
                  courseSlug={slug}
                  firstLessonSlug={course.modules?.[0]?.lessons?.[0]?.slug ?? null}
                  priceCents={course.price_cents}
                  enrolled={enrolled}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="mx-auto max-w-[1400px] px-6 py-12 md:px-10">
          <p className="mb-8 font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary">
            [ Curriculum ]
          </p>

          <div className="flex flex-col gap-4">
            {course.modules?.map((module: Module, moduleIdx: number) => (
              <div
                key={module.id}
                className="overflow-hidden rounded-[3px] border border-ops-border bg-ops-surface transition-[border-color] duration-300 hover:border-ops-border-hover"
              >
                {/* Module header */}
                <div className="border-b border-ops-border px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ops-border font-caption text-[10px] text-ops-text-secondary">
                      {moduleIdx + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-heading text-base font-medium text-ops-text-primary">
                        {module.title}
                      </h3>
                      {module.description && (
                        <p className="mt-0.5 font-body text-xs font-light text-ops-text-secondary">
                          {module.description}
                        </p>
                      )}
                    </div>
                    <span className="font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">
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
                        className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-ops-surface-elevated"
                      >
                        <span className="font-caption text-[10px] text-ops-text-secondary">
                          {moduleIdx + 1}.{lessonIdx + 1}
                        </span>
                        <span className="flex-1 font-body text-sm font-light text-ops-text-secondary transition-colors group-hover:text-ops-text-primary">
                          {lesson.title}
                        </span>
                        {lesson.is_preview && !isFree && (
                          <span className="rounded-[3px] border border-ops-accent/30 px-2 py-0.5 font-caption text-[9px] uppercase tracking-[0.1em] text-ops-accent">
                            Preview
                          </span>
                        )}
                        {lesson.duration_minutes && (
                          <span className="font-caption text-[10px] text-ops-text-secondary">
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
      <Footer />
    </>
  );
}
