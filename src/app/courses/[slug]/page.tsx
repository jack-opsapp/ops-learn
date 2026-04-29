import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EnrollButton from '@/components/EnrollButton';
import CourseCurriculum from '@/components/CourseCurriculum';
import { getCourseWithModuleItems, getSessionUser, getUserEnrollment, createPaidEnrollment } from '@/lib/supabase/queries';
import { getCourseChallenge, getChallengeAttempt } from '@/lib/supabase/challenge-queries';

export default async function CourseDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { slug } = await params;
  const { paid: paidParam } = await searchParams;
  const course = await getCourseWithModuleItems(slug);

  if (!course) notFound();

  const sessionUser = await getSessionUser();
  let enrollment = sessionUser
    ? await getUserEnrollment(sessionUser.uid, course.id)
    : null;

  // If redirected from Stripe checkout success and no enrollment exists yet,
  // create it with 'purchased' status (user must still click "Add Course" to activate)
  if (paidParam === 'true' && sessionUser && !enrollment) {
    enrollment = await createPaidEnrollment(sessionUser.uid, course.id);
  }

  // enrolled: null = not signed in, false = not enrolled,
  // 'purchased' = paid but not added, true = active/completed
  const enrolled: null | false | 'purchased' | true = sessionUser === null
    ? null
    : !enrollment
      ? false
      : enrollment.status === 'purchased'
        ? 'purchased'
        : true;

  const isFree = course.price_cents === 0;

  // Check if course has a challenge quiz
  const challenge = !isFree ? await getCourseChallenge(course.id) : null;
  let challengeAttempt = null;
  if (challenge && sessionUser) {
    challengeAttempt = await getChallengeAttempt(challenge.id, sessionUser.uid);
  }
  const totalLessons = course.modules?.reduce(
    (acc, m) => acc + m.items.filter((i) => i.kind === 'lesson').length,
    0
  ) ?? 0;
  const totalAssessments = course.modules?.reduce(
    (acc, m) => acc + m.items.filter((i) => i.kind === 'assessment').length,
    0
  ) ?? 0;

  return (
    <>
      <Header />
      <main className="relative z-10">
        {/* Hero area */}
        <section className="relative px-6 pt-28 pb-12 md:px-10 lg:px-24">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.04)] via-ops-background to-ops-background" />

          <div className="relative mx-auto max-w-[1400px]">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                <Link href="/" className="transition-colors duration-150 hover:text-ops-text-primary">
                  COURSES
                </Link>
                <span className="text-ops-text-mute" aria-hidden="true">//</span>
                <span className="text-ops-text-primary">{course.title.toUpperCase()}</span>
              </div>
            </nav>

            {/* Course header */}
            <div className="max-w-2xl">
              <h1
                className="font-display font-light uppercase text-ops-text-primary"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.1 }}
              >
                {course.title}
              </h1>
              <p className="mt-4 font-body text-lg leading-relaxed text-ops-text-secondary">
                {course.description}
              </p>

              {/* Meta bar */}
              <div className="mt-6 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
                {enrolled === true && !isFree ? (
                  <span
                    className="rounded-[4px] px-2 py-[2px]"
                    style={{ color: '#9DB582', background: 'rgba(157,181,130,0.12)', border: '1px solid rgba(157,181,130,0.30)' }}
                  >
                    PAID
                  </span>
                ) : isFree ? (
                  <span
                    className="rounded-[4px] px-2 py-[2px]"
                    style={{ color: '#9DB582', background: 'rgba(157,181,130,0.12)', border: '1px solid rgba(157,181,130,0.30)' }}
                  >
                    FREE
                  </span>
                ) : (
                  <span className="rounded-[4px] border border-ops-border bg-[rgba(255,255,255,0.05)] px-2 py-[2px] text-ops-text-primary" style={{ fontFeatureSettings: '"tnum" 1, "zero" 1' }}>
                    ${(course.price_cents / 100).toFixed(0)}
                  </span>
                )}
                <span>{course.modules?.length ?? 0} MODULES</span>
                <span className="text-ops-text-mute" aria-hidden="true">·</span>
                <span>{totalLessons} LESSONS</span>
                {totalAssessments > 0 && (
                  <>
                    <span className="text-ops-text-mute" aria-hidden="true">·</span>
                    <span>{totalAssessments} ASSESSMENTS</span>
                  </>
                )}
                {course.estimated_duration_minutes && (
                  <>
                    <span className="text-ops-text-mute" aria-hidden="true">·</span>
                    <span>{course.estimated_duration_minutes} MIN TOTAL</span>
                  </>
                )}
              </div>

              {/* CTA — enrollment-aware */}
              <div className="mt-8">
                <EnrollButton
                  courseId={course.id}
                  courseSlug={slug}
                  firstLessonSlug={course.modules?.[0]?.items?.find((i) => i.kind === 'lesson')?.slug ?? null}
                  priceCents={course.price_cents}
                  enrolled={enrolled}
                />
                {/* Challenge CTA — paid courses with a challenge, not yet actively enrolled */}
                {challenge && enrolled !== true && (
                  <div className="mt-3">
                    <a
                      href={`/courses/${slug}/challenge`}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[5px] border border-ops-border bg-transparent px-6 py-3 font-display text-[14px] uppercase tracking-wider text-ops-text-secondary transition-colors duration-150 hover:border-ops-border-hover hover:text-ops-text-primary"
                    >
                      {challengeAttempt
                        ? 'VIEW CHALLENGE RESULTS'
                        : 'CHALLENGE THIS COURSE'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum */}
        <section className="mx-auto max-w-[1400px] px-6 py-12 md:px-10">
          <p className="mb-8 font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
            // CURRICULUM
          </p>

          <CourseCurriculum
            modules={course.modules ?? []}
            courseSlug={slug}
            priceCents={course.price_cents}
            courseId={course.id}
            enrolled={enrolled}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
