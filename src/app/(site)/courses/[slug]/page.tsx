import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EnrollButton from '@/components/EnrollButton';
import CourseCurriculum from '@/components/CourseCurriculum';
import { getCourseWithModuleItems, getSessionUser, getUserEnrollment, createPaidEnrollment } from '@/lib/supabase/queries';

export default async function CourseDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ enrolled?: string }>;
}) {
  const { slug } = await params;
  const { enrolled: enrolledParam } = await searchParams;
  const course = await getCourseWithModuleItems(slug);

  if (!course) notFound();

  const sessionUser = await getSessionUser();
  let enrollment = sessionUser
    ? await getUserEnrollment(sessionUser.uid, course.id)
    : null;

  // If redirected from Stripe checkout success and no enrollment exists yet,
  // create it now (safety net in case webhook hasn't fired yet)
  if (enrolledParam === 'true' && sessionUser && !enrollment) {
    enrollment = await createPaidEnrollment(sessionUser.uid, course.id);
  }

  // enrolled: null = not signed in, false = signed in but not enrolled, true = enrolled
  const enrolled = sessionUser === null ? null : enrollment !== null;

  const isFree = course.price_cents === 0;
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
                {enrolled === true && !isFree ? (
                  <span className="rounded-[3px] bg-emerald-500/10 px-3 py-1 text-emerald-400">
                    Paid
                  </span>
                ) : isFree ? (
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
                {totalAssessments > 0 && (
                  <>
                    <span className="text-ops-border">|</span>
                    <span>{totalAssessments} assessments</span>
                  </>
                )}
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
                  firstLessonSlug={course.modules?.[0]?.items?.find((i) => i.kind === 'lesson')?.slug ?? null}
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
