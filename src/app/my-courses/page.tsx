import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SubmissionsDashboard from '@/components/SubmissionsDashboard';
import {
  getSessionUser,
  getUserEnrolledCourses,
  getPublishedCourses,
} from '@/lib/supabase/queries';

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/auth/login?next=/my-courses');
  }

  const { tab } = await searchParams;
  const activeTab = tab === 'submissions' ? 'submissions' : 'courses';

  const [enrolledCourses, allCourses] = await Promise.all([
    getUserEnrolledCourses(sessionUser.uid),
    getPublishedCourses(),
  ]);

  const enrolledIds = new Set(enrolledCourses.map((c) => c.id));
  const moreCourses = allCourses.filter((c) => !enrolledIds.has(c.id));

  const displayName =
    sessionUser.email?.split('@')[0]?.toUpperCase() ?? 'USER';

  return (
    <>
      <Header />
      <main className="relative z-10">
        {/* Header area */}
        <section className="relative px-6 pt-28 pb-4 md:px-10 lg:px-24">
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.04)] via-ops-background to-ops-background" />
          <div className="relative mx-auto max-w-[1400px]">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute mb-2">
              // DASHBOARD
            </p>
            <h1 className="font-display text-3xl font-light uppercase text-ops-text-primary md:text-4xl">
              {`// OPERATOR :: ${displayName}`}
            </h1>
          </div>
        </section>

        {/* Tab navigation */}
        <section className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="flex items-center gap-2 border-b border-ops-border">
            <Link
              href="/my-courses"
              className={`relative inline-flex min-h-[44px] items-center px-3 font-display text-[12px] uppercase tracking-wider transition-colors duration-150 ${
                activeTab === 'courses'
                  ? 'text-ops-text-primary'
                  : 'text-ops-text-secondary hover:text-ops-text-primary'
              }`}
            >
              MY COURSES
              {activeTab === 'courses' && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] bg-ops-text-secondary" aria-hidden="true" />
              )}
            </Link>
            <Link
              href="/my-courses?tab=submissions"
              className={`relative inline-flex min-h-[44px] items-center px-3 font-display text-[12px] uppercase tracking-wider transition-colors duration-150 ${
                activeTab === 'submissions'
                  ? 'text-ops-text-primary'
                  : 'text-ops-text-secondary hover:text-ops-text-primary'
              }`}
            >
              SUBMISSIONS
              {activeTab === 'submissions' && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] bg-ops-text-secondary" aria-hidden="true" />
              )}
            </Link>
          </div>
        </section>

        {/* Submissions tab */}
        {activeTab === 'submissions' ? (
          <section className="mx-auto max-w-[1400px] px-6 py-10 md:px-10">
            <SubmissionsDashboard />
          </section>
        ) : (
        <>
        {/* My Courses */}
        <section className="mx-auto max-w-[1400px] px-6 py-10 md:px-10">
          <div className="mb-6 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
              {`// MY COURSES — ${enrolledCourses.length}`}
            </p>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="glass-surface px-8 py-16 text-center">
              <span className="font-display text-5xl font-light tracking-wider text-white/[0.04]" aria-hidden="true">
                OPS
              </span>
              <h2 className="mt-4 font-display text-xl font-light uppercase text-ops-text-primary">
                NO COURSES YET
              </h2>
              <p className="mt-2 font-body text-sm text-ops-text-secondary">
                Browse the catalog to get started.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-[5px] border border-ops-accent bg-transparent px-6 py-3 font-display text-[14px] uppercase tracking-wider text-ops-accent transition-colors duration-150 hover:bg-ops-accent hover:text-ops-background"
              >
                BROWSE COURSES
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
                    className="glass-surface group flex flex-col overflow-hidden transition-colors duration-150 hover:border-ops-border-hover sm:flex-row"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-[rgba(255,255,255,0.04)] sm:aspect-[16/10] sm:w-56 md:w-72">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-display text-3xl font-light tracking-wider text-white/[0.06]" aria-hidden="true">
                            OPS
                          </span>
                        </div>
                      )}
                      <div
                        className="absolute inset-0 sm:hidden"
                        style={{
                          background:
                            'linear-gradient(to top, rgba(18,18,20,0.95), transparent 50%)',
                        }}
                        aria-hidden="true"
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
                            <span
                              className="shrink-0 rounded-[4px] px-2 py-[2px] font-mono text-[11px] uppercase tracking-wider"
                              style={{
                                color: '#9DB582',
                                background: 'rgba(157,181,130,0.12)',
                                border: '1px solid rgba(157,181,130,0.30)',
                              }}
                            >
                              COMPLETE
                            </span>
                          ) : (
                            <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                              {progressPercent}%
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 font-body text-sm text-ops-text-secondary">
                          {course.description}
                        </p>
                      </div>

                      {/* Progress bar + meta */}
                      <div className="mt-4">
                        <div className="flex items-center gap-3">
                          <div className="h-[2px] flex-1 overflow-hidden rounded-[2px] bg-ops-border">
                            <div
                              className="h-[2px] rounded-[2px] bg-ops-text-secondary transition-[width] duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                            {course.completedLessons}/{course.totalLessons} LESSONS
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                          <span>{course.moduleCount} MODULES</span>
                          {course.estimatedDuration && (
                            <>
                              <span className="text-ops-text-mute" aria-hidden="true">·</span>
                              <span>{course.estimatedDuration} MIN</span>
                            </>
                          )}
                          <span className="ml-auto text-ops-text-tertiary">
                            ENROLLED{' '}
                            {new Date(course.enrolledAt)
                              .toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                              .toUpperCase()}
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
                        className="text-ops-text-tertiary transition-transform duration-150 group-hover:translate-x-1 group-hover:text-ops-text-primary"
                        aria-hidden="true"
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
              <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
                // BROWSE MORE COURSES
              </p>
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-150 hover:text-ops-text-primary"
              >
                VIEW ALL →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {moreCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="glass-surface group flex flex-col overflow-hidden transition-colors duration-150 hover:border-ops-border-hover"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-[rgba(255,255,255,0.04)]">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-display text-4xl font-light tracking-wider text-white/[0.06]" aria-hidden="true">
                          OPS
                        </span>
                      </div>
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to top, rgba(18,18,20,0.95), transparent)',
                      }}
                      aria-hidden="true"
                    />
                    {course.price_cents === 0 ? (
                      <span
                        className="absolute top-3 right-3 rounded-[4px] px-2 py-[2px] font-mono text-[11px] uppercase tracking-wider"
                        style={{
                          color: '#9DB582',
                          background: 'rgba(157,181,130,0.12)',
                          border: '1px solid rgba(157,181,130,0.30)',
                        }}
                      >
                        FREE
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 rounded-[4px] bg-[rgba(18,18,20,0.78)] px-2 py-[2px] font-mono text-[11px] text-ops-text-primary backdrop-blur-sm border border-[rgba(255,255,255,0.10)]">
                        ${(course.price_cents / 100).toFixed(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading text-lg font-medium text-ops-text-primary">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-ops-text-secondary">
                      {course.description}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-4 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                      <span>{course.modules?.length ?? 0} MODULES</span>
                      <span className="text-ops-text-mute" aria-hidden="true">·</span>
                      <span>
                        {course.modules?.reduce(
                          (acc: number, m: { lessons?: { id: string }[] }) =>
                            acc + (m.lessons?.length ?? 0),
                          0
                        ) ?? 0}{' '}
                        LESSONS
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        </>
        )}
      </main>
      <Footer />
    </>
  );
}
