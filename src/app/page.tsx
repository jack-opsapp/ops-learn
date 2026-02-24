import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CourseCard from '@/components/CourseCard';
import { getPublishedCourses } from '@/lib/supabase/queries';

export default async function CourseCatalog() {
  const courses = await getPublishedCourses();

  const freeCourses = courses.filter((c) => c.price_cents === 0);
  const paidCourses = courses.filter((c) => c.price_cents > 0);

  return (
    <>
      <Header />
      <main className="relative z-10">
        {/* Hero */}
        <section className="relative min-h-[60vh] flex flex-col justify-end px-6 pb-16 md:px-10 lg:px-24">
          {/* Gradient base — matches ops-site Hero */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-ops-background to-[#060606]" />
          {/* Bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-ops-background/80 via-transparent to-transparent" />
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.03]">
            <svg className="h-full w-full">
              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>
          </div>

          <div className="relative max-w-[1400px] mx-auto w-full">
            <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary mb-4">
              [ OPS Learn ]
            </p>
            <h1
              className="font-heading font-bold uppercase text-ops-text-primary"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1.05 }}
            >
              Learn to build a business
              <br />
              <span className="text-ops-accent">that works without you.</span>
            </h1>
            <p className="mt-5 max-w-xl font-body text-lg font-light text-ops-text-secondary md:text-xl">
              Free and premium courses for service business owners, operators, and
              anyone ready to stop trading time for money.
            </p>

            {/* Trust line */}
            <p className="mt-6 font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary">
              Start free &middot; No account required &middot; Built by OPS
            </p>
          </div>
        </section>

        {/* Free Courses */}
        {freeCourses.length > 0 && (
          <section id="free" className="mx-auto max-w-[1400px] px-6 py-16 md:px-10">
            <div className="mb-8 flex items-center gap-4">
              <p className="font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary">
                [ Free Courses ]
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {freeCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  slug={course.slug}
                  title={course.title}
                  description={course.description ?? ''}
                  thumbnailUrl={course.thumbnail_url ?? undefined}
                  estimatedDuration={
                    course.estimated_duration_minutes ?? undefined
                  }
                  moduleCount={course.modules?.length ?? 0}
                  lessonCount={
                    course.modules?.reduce(
                      (acc: number, m: { lessons?: { id: string }[] }) =>
                        acc + (m.lessons?.length ?? 0),
                      0
                    ) ?? 0
                  }
                  isFree={true}
                  priceCents={0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Paid Courses */}
        {paidCourses.length > 0 && (
          <section id="premium" className="mx-auto max-w-[1400px] px-6 py-16 md:px-10">
            <p className="mb-8 font-caption text-[11px] uppercase tracking-[0.2em] text-ops-text-secondary">
              [ Premium Courses ]
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paidCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  slug={course.slug}
                  title={course.title}
                  description={course.description ?? ''}
                  thumbnailUrl={course.thumbnail_url ?? undefined}
                  estimatedDuration={
                    course.estimated_duration_minutes ?? undefined
                  }
                  moduleCount={course.modules?.length ?? 0}
                  lessonCount={
                    course.modules?.reduce(
                      (acc: number, m: { lessons?: { id: string }[] }) =>
                        acc + (m.lessons?.length ?? 0),
                      0
                    ) ?? 0
                  }
                  isFree={false}
                  priceCents={course.price_cents}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {courses.length === 0 && (
          <section className="flex flex-col items-center justify-center px-6 py-32 text-center">
            <span className="font-heading text-6xl font-bold text-white/[0.06]">
              OPS
            </span>
            <h2 className="mt-6 font-heading text-2xl font-medium text-ops-text-primary">
              Courses coming soon
            </h2>
            <p className="mt-3 max-w-md font-body text-sm font-light text-ops-text-secondary">
              We&apos;re building something great. Check back soon for free and premium
              courses to help you run your business better.
            </p>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
