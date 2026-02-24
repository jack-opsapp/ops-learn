import Header from '@/components/Header';
import CourseCard from '@/components/CourseCard';
import { getPublishedCourses } from '@/lib/supabase/queries';

export default async function CourseCatalog() {
  const courses = await getPublishedCourses();

  const freeCourses = courses.filter((c) => c.price_cents === 0);
  const paidCourses = courses.filter((c) => c.price_cents > 0);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6">
        {/* Hero */}
        <section className="mb-16">
          <h1 className="font-heading text-4xl font-bold leading-tight text-ops-text-primary sm:text-5xl">
            Learn to build a business
            <br />
            <span className="text-ops-accent">that works without you.</span>
          </h1>
          <p className="mt-4 max-w-xl font-body text-lg text-ops-text-secondary">
            Free and premium courses for service business owners, operators, and
            anyone ready to stop trading time for money.
          </p>
        </section>

        {/* Free Courses */}
        {freeCourses.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="font-heading text-2xl font-semibold text-ops-text-primary">
                Free Courses
              </h2>
              <span className="rounded-ops-lg bg-ops-success/10 px-2 py-0.5 font-caption text-xs text-ops-success">
                No account required
              </span>
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
          <section className="mb-16">
            <h2 className="mb-6 font-heading text-2xl font-semibold text-ops-text-primary">
              Premium Courses
            </h2>
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
          <section className="flex flex-col items-center justify-center py-24 text-center">
            <span className="font-heading text-6xl text-ops-accent/20">
              OPS
            </span>
            <h2 className="mt-4 font-heading text-2xl font-semibold text-ops-text-primary">
              Courses coming soon
            </h2>
            <p className="mt-2 max-w-md font-body text-ops-text-secondary">
              We&apos;re building something great. Check back soon for free and premium
              courses to help you run your business better.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
