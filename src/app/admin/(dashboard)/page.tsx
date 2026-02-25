import { getCourseList } from '@/lib/admin/actions';
import AdminCourseCard from '@/components/admin/CourseCard';

export const metadata = {
  title: 'Courses | OPS Admin',
};

export default async function AdminCoursesPage() {
  const courses = await getCourseList();

  return (
    <>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold uppercase text-ops-text-primary">
          Courses
        </h1>
        <p className="mt-1 font-caption text-[11px] uppercase tracking-[0.15em] text-ops-text-secondary">
          {courses.length} course{courses.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <AdminCourseCard key={course.id} course={course} />
        ))}
      </div>

      {courses.length === 0 && (
        <p className="mt-16 text-center font-body text-sm text-ops-text-secondary">
          No courses found.
        </p>
      )}
    </>
  );
}
