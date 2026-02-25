import Link from 'next/link';
import type { CourseOverview } from '@/lib/admin/types';

const statusStyles: Record<string, { dot: string; label: string }> = {
  published: { dot: 'bg-ops-success', label: 'Published' },
  draft: { dot: 'bg-ops-warning', label: 'Draft' },
  archived: { dot: 'bg-ops-text-secondary', label: 'Archived' },
};

export default function AdminCourseCard({ course }: { course: CourseOverview }) {
  const s = statusStyles[course.status] ?? statusStyles.draft;
  const price = course.price_cents === 0
    ? 'FREE'
    : `$${(course.price_cents / 100).toFixed(0)}`;

  return (
    <Link
      href={`/admin/courses/${course.id}`}
      className="block bg-ops-surface border border-ops-border rounded-[3px] p-6 transition-colors hover:border-ops-border-hover"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="font-heading text-lg font-semibold text-ops-text-primary leading-tight">
          {course.title}
        </h3>
        <span className="shrink-0 font-caption text-[11px] uppercase tracking-[0.1em] text-ops-accent">
          {price}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        <span className="font-caption text-[10px] uppercase tracking-[0.15em] text-ops-text-secondary">
          {s.label}
        </span>
      </div>

      {/* Content stats */}
      <p className="font-caption text-[11px] text-ops-text-secondary mb-3">
        {course.module_count} modules &middot; {course.lesson_count} lessons &middot; {course.assessment_count} assessments
      </p>

      {/* Real metrics */}
      <p className="font-caption text-[10px] uppercase tracking-[0.1em] text-ops-text-secondary mb-1">
        Real: {course.enrolled_count} enrolled &middot; {course.completed_count} completed
      </p>

      {/* Vanity metrics */}
      <p className="font-caption text-[10px] uppercase tracking-[0.1em] text-ops-accent">
        Display: {course.display_enrollments} enrolled &middot; {course.display_rating.toFixed(1)}&star; &middot; {course.display_review_count} reviews
      </p>
    </Link>
  );
}
