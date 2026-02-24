import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  getSessionUser,
  getUserEnrolledCourses,
  getPublishedCourses,
} from '@/lib/supabase/queries';

export default async function MyCoursesPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/auth/login?next=/my-courses');
  }

  const [enrolledCourses, allCourses] = await Promise.all([
    getUserEnrolledCourses(sessionUser.uid),
    getPublishedCourses(),
  ]);

  const enrolledIds = new Set(enrolledCourses.map((c) => c.id));
  const moreCourses = allCourses.filter((c) => !enrolledIds.has(c.id));

  const displayName =
    sessionUser.email?.split('@')[0] ?? 'there';

  return (
    <>
      <Header />
      <main className="relative z-10">
        {/* Header area */}
        <section className="relative px-6 pt-28 pb-4 md:px-10 lg:px-24">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f] via-ops-background to-ops-background" />
          <div className="relative mx-auto max-w-[1400px]">
            <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary mb-2">
              [ Dashboard ]
            </p>
            <h1 className="font-heading text-3xl font-bold uppercase text-ops-text-primary md:text-4xl">
              Welcome back, {displayName}
            </h1>
          </div>
        </section>

        {/* My Courses */}
        <section className="mx-auto max-w-[1400px] px-6 py-10 md:px-10">
          <div className="mb-6 flex items-center justify-between">
            <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary">
              [ My Courses ] &mdash; {enrolledCourses.length}
            </p>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="rounded-[3px] border border-ops-border bg-ops-surface px-8 py-16 text-center">
              <span className="font-heading text-5xl font-bold text-white/[0.04]">
                OPS
              </span>
              <h2 className="mt-4 font-heading text-xl font-medium text-ops-text-primary">
                No courses yet
              </h2>
              <p className="mt-2 font-body text-sm font-light text-ops-text-secondary">
                Browse our catalog below to get started.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-[3px] bg-ops-text-primary px-6 py-3 font-caption text-xs uppercase tracking-[0.15em] text-ops-background transition-all hover:bg-white/90"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {enrolledCourses.map((course) => {
                const progressPercent =
                  course.totalLessons > 0
                    ? Math.round(
                        (course.completedLessons / course.totalLessons) * 100
                      )
                    : 0;
                const isComplete = progressPercent === 100;

                return (
                  <Link
                    key={course.id}
                    href={
                      course.firstIncompleteLessonSlug
                        ? `/courses/${course.slug}/lessons/${course.firstIncompleteLessonSlug}`
                        : `/courses/${course.slug}`
                    }
                    className="group flex flex-col overflow-hidden rounded-[3px] border border-ops-border bg-ops-surface transition-[border-color] duration-300 hover:border-ops-border-hover sm:flex-row"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-ops-surface-elevated sm:aspect-[16/10] sm:w-56 md:w-72">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-heading text-3xl font-bold text-white/[0.06]">
                            OPS
                          </span>
                        </div>
                      )}
                      <div
                        className="absolute inset-0 sm:hidden"
                        style={{
                          background:
                            'linear-gradient(to top, #0D0D0D, transparent 50%)',
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-heading text-lg font-medium text-ops-text-primary">
                            {course.title}
                          </h3>
                          {isComplete ? (
                            <span className="shrink-0 rounded-[3px] bg-ops-accent/10 px-2.5 py-1 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-accent">
                              Complete
                            </span>
                          ) : (
                            <span className="shrink-0 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">
                              {progressPercent}%
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 font-body text-sm font-light text-ops-text-secondary">
                          {course.description}
                        </p>
                      </div>

                      {/* Progress bar + meta */}
                      <div className="mt-4">
                        <div className="flex items-center gap-3">
                          <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-ops-border">
                            <div
                              className="h-[2px] rounded-full bg-ops-accent transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="shrink-0 font-caption text-[10px] tracking-[0.1em] text-ops-text-secondary">
                            {course.completedLessons}/{course.totalLessons} lessons
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-3 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">
                          <span>{course.moduleCount} modules</span>
                          {course.estimatedDuration && (
                            <>
                              <span className="text-ops-border">|</span>
                              <span>{course.estimatedDuration} min</span>
                            </>
                          )}
                          <span className="ml-auto font-body normal-case text-[10px] text-ops-text-secondary/60">
                            Enrolled{' '}
                            {new Date(course.enrolledAt).toLocaleDateString(
                              'en-US',
                              { month: 'short', day: 'numeric', year: 'numeric' }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Continue arrow */}
                    <div className="hidden items-center pr-6 sm:flex">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="text-ops-text-secondary transition-all group-hover:translate-x-1 group-hover:text-ops-accent"
                      >
                        <path
                          d="M6 3L11 8L6 13"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Browse More */}
        {moreCourses.length > 0 && (
          <section className="mx-auto max-w-[1400px] px-6 py-10 md:px-10">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary">
                [ Browse More Courses ]
              </p>
              <Link
                href="/"
                className="font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary transition-colors hover:text-ops-text-primary"
              >
                View All
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {moreCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[3px] border border-ops-border bg-ops-surface transition-[border-color] duration-300 hover:border-ops-border-hover"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-ops-surface-elevated">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-heading text-4xl font-bold text-white/[0.06]">
                          OPS
                        </span>
                      </div>
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 h-12"
                      style={{
                        background: 'linear-gradient(to top, #0D0D0D, transparent)',
                      }}
                    />
                    {course.price_cents === 0 ? (
                      <span className="absolute top-3 right-3 rounded-[3px] bg-ops-accent/90 px-2.5 py-1 font-caption text-[10px] uppercase tracking-[0.1em] text-white">
                        Free
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 rounded-[3px] bg-ops-surface/80 px-2.5 py-1 font-caption text-[10px] text-ops-text-primary backdrop-blur-sm border border-ops-border">
                        ${(course.price_cents / 100).toFixed(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading text-lg font-medium text-ops-text-primary">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 font-body text-sm font-light leading-relaxed text-ops-text-secondary">
                      {course.description}
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-4 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">
                      <span>{course.modules?.length ?? 0} modules</span>
                      <span className="text-ops-border">|</span>
                      <span>
                        {course.modules?.reduce(
                          (acc: number, m: { lessons?: { id: string }[] }) =>
                            acc + (m.lessons?.length ?? 0),
                          0
                        ) ?? 0}{' '}
                        lessons
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
