import { cookies } from 'next/headers';
import { createServiceClient } from './server';
import { verifyIdToken } from '@/lib/firebase/admin';

const SESSION_COOKIE = 'ops-learn-session';

/**
 * Get the current Firebase user from the session cookie.
 * Returns { uid, email } or null if not signed in.
 */
export async function getSessionUser(): Promise<{ uid: string; email: string | undefined } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const decoded = await verifyIdToken(token);
  if (!decoded) return null;

  return { uid: decoded.uid, email: decoded.email };
}

export async function getUserEnrollment(userId: string, courseId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  return data;
}

export async function enrollInFreeCourse(userId: string, courseId: string) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('enrollments')
    .insert({ user_id: userId, course_id: courseId, status: 'active' })
    .select('id')
    .single();

  if (error) {
    console.error('Error enrolling in free course:', error);
    return null;
  }
  return data;
}

export async function getPublishedCourses() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      title,
      slug,
      description,
      thumbnail_url,
      price_cents,
      status,
      sort_order,
      estimated_duration_minutes,
      modules (
        id,
        title,
        sort_order,
        lessons (
          id
        )
      )
    `
    )
    .eq('status', 'published')
    .order('sort_order');

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  return data ?? [];
}

export async function getCourseBySlug(slug: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      title,
      slug,
      description,
      thumbnail_url,
      price_cents,
      status,
      estimated_duration_minutes,
      modules (
        id,
        title,
        description,
        sort_order,
        lessons (
          id,
          title,
          slug,
          description,
          duration_minutes,
          sort_order,
          is_preview
        )
      )
    `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  if (data?.modules) {
    data.modules.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    data.modules.forEach((m: { lessons?: { sort_order: number }[] }) => {
      m.lessons?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    });
  }

  return data;
}

export async function getUserEnrolledCourses(userId: string) {
  const supabase = createServiceClient();

  // Get all enrollments for this user
  const { data: enrollments, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, course_id, enrolled_at, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (enrollErr || !enrollments?.length) return [];

  const courseIds = enrollments.map((e) => e.course_id);

  // Get course details with modules and lessons
  const { data: courses, error: courseErr } = await supabase
    .from('courses')
    .select(`
      id, title, slug, description, thumbnail_url, price_cents,
      estimated_duration_minutes,
      modules (
        id, title, sort_order,
        lessons ( id, slug, sort_order )
      )
    `)
    .in('id', courseIds)
    .eq('status', 'published');

  if (courseErr || !courses) return [];

  // Get lesson progress for this user across all lessons in these courses
  const allLessonIds: string[] = [];
  for (const course of courses) {
    for (const mod of course.modules ?? []) {
      for (const lesson of mod.lessons ?? []) {
        allLessonIds.push(lesson.id);
      }
    }
  }

  let completedLessonIds: Set<string> = new Set();
  if (allLessonIds.length > 0) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('lesson_id', allLessonIds);

    if (progress) {
      completedLessonIds = new Set(progress.map((p) => p.lesson_id));
    }
  }

  // Combine enrollment + course + progress
  return courses.map((course) => {
    const enrollment = enrollments.find((e) => e.course_id === course.id)!;
    const totalLessons = course.modules?.reduce(
      (acc: number, m: { lessons?: { id: string }[] }) => acc + (m.lessons?.length ?? 0), 0
    ) ?? 0;
    const completedLessons = course.modules?.reduce(
      (acc: number, m: { lessons?: { id: string }[] }) =>
        acc + (m.lessons?.filter((l) => completedLessonIds.has(l.id)).length ?? 0), 0
    ) ?? 0;

    // Find first incomplete lesson for "continue" link
    let firstIncompleteLessonSlug: string | null = null;
    const sortedModules = [...(course.modules ?? [])].sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    );
    for (const mod of sortedModules) {
      const sortedLessons = [...(mod.lessons ?? [])].sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
      );
      for (const lesson of sortedLessons) {
        if (!completedLessonIds.has(lesson.id)) {
          firstIncompleteLessonSlug = lesson.slug;
          break;
        }
      }
      if (firstIncompleteLessonSlug) break;
    }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      priceCents: course.price_cents,
      estimatedDuration: course.estimated_duration_minutes,
      moduleCount: course.modules?.length ?? 0,
      totalLessons,
      completedLessons,
      enrolledAt: enrollment.enrolled_at,
      firstIncompleteLessonSlug:
        firstIncompleteLessonSlug ?? sortedModules[0]?.lessons?.[0]?.slug ?? null,
    };
  });
}

export async function getContentBlocksByLessonId(lessonId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('content_blocks')
    .select('id, type, content, sort_order')
    .eq('lesson_id', lessonId)
    .order('sort_order');

  if (error) {
    console.error('Error fetching content blocks:', error);
    return [];
  }
  return data ?? [];
}

export async function getLessonWithContent(
  courseSlug: string,
  lessonSlug: string
) {
  const supabase = createServiceClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single();

  if (!course) return null;

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(
      `
      id,
      title,
      slug,
      description,
      duration_minutes,
      sort_order,
      is_preview,
      module_id,
      content_blocks (
        id,
        type,
        content,
        sort_order
      ),
      modules!inner (
        id,
        title,
        sort_order,
        course_id,
        courses!inner (
          id,
          slug,
          status
        )
      )
    `
    )
    .eq('slug', lessonSlug)
    .eq('modules.courses.slug', courseSlug)
    .single();

  if (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }

  if (lesson?.content_blocks) {
    lesson.content_blocks.sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    );
  }

  return { course, lesson };
}
