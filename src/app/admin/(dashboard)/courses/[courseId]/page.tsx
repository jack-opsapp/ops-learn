import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCourseDetail, getCourseAnalytics } from '@/lib/admin/actions';
import CurriculumTree from '@/components/admin/CurriculumTree';
import AnalyticsSection from '@/components/admin/AnalyticsSection';
import VanityMetricsEditor from '@/components/admin/VanityMetricsEditor';

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = await getCourseDetail(courseId);
  return { title: course ? `${course.title} | OPS Admin` : 'Course | OPS Admin' };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const [course, analytics] = await Promise.all([
    getCourseDetail(courseId),
    getCourseAnalytics(courseId),
  ]);

  if (!course) notFound();

  const price = course.price_cents === 0
    ? 'FREE'
    : `$${(course.price_cents / 100).toFixed(0)}`;

  return (
    <>
      {/* Back + header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary hover:text-ops-text-primary transition-colors mb-4"
        >
          &larr; All Courses
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold uppercase text-ops-text-primary">
              {course.title}
            </h1>
            <p className="mt-1 font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary">
              {course.status} &middot; {price}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Curriculum */}
      <section className="mb-12">
        <h2 className="font-caption text-[10px] uppercase tracking-[0.2em] text-ops-text-secondary mb-4">
          [ Curriculum ]
        </h2>
        <CurriculumTree modules={course.modules} />
      </section>

      {/* Section 2: Analytics */}
      <section className="mb-12">
        <h2 className="font-caption text-[10px] uppercase tracking-[0.2em] text-ops-text-secondary mb-4">
          [ Analytics ]
        </h2>
        <AnalyticsSection analytics={analytics} />
      </section>

      {/* Section 3: Vanity Metrics */}
      <section className="mb-12">
        <h2 className="font-caption text-[10px] uppercase tracking-[0.2em] text-ops-text-secondary mb-4">
          [ Display Metrics ]
        </h2>
        <VanityMetricsEditor
          courseId={course.id}
          initial={{
            display_enrollments: course.display_enrollments,
            display_rating: course.display_rating,
            display_review_count: course.display_review_count,
          }}
        />
      </section>
    </>
  );
}
