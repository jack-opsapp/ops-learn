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
          {/* Gradient base — pure-black canvas, soft top sheen */}
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,255,255,0.04)] via-ops-background to-ops-background" />
          {/* Bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-ops-background via-transparent to-transparent" />
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
            <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute mb-4">
              // OPS LEARN
            </p>
            <h1
              className="font-display font-light uppercase text-ops-text-primary"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1.05 }}
            >
              Learn to build a business
              <br />
              <span className="text-ops-text-secondary">that works without you.</span>
            </h1>
            <p className="mt-5 max-w-xl font-body text-lg text-ops-text-secondary md:text-xl">
              Free and premium courses for service business owners, operators, and
              anyone ready to stop trading time for money.
            </p>

            {/* Trust line */}
            <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-ops-text-tertiary">
              START FREE · NO ACCOUNT REQUIRED · BUILT BY OPS
            </p>
          </div>
        </section>

        {/* Free Courses */}
        {freeCourses.length > 0 && (
          <section id="free" className="mx-auto max-w-[1400px] px-6 py-16 md:px-10">
            <div className="mb-8 flex items-center gap-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
                // FREE COURSES
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
            <p className="mb-8 font-mono text-[11px] uppercase tracking-wider text-ops-text-mute">
              // PREMIUM COURSES
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
            <span className="font-display text-6xl font-light tracking-wider text-white/[0.06]" aria-hidden="true">
              OPS
            </span>
            <h2 className="mt-6 font-display text-2xl font-light uppercase text-ops-text-primary">
              COURSES COMING SOON
            </h2>
            <p className="mt-3 max-w-md font-body text-sm text-ops-text-secondary">
              Free and premium courses are in production. Check back soon.
            </p>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
