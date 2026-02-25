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

export async function createPaidEnrollment(userId: string, courseId: string) {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('enrollments')
    .insert({ user_id: userId, course_id: courseId, status: 'purchased' })
    .select('id, status')
    .single();

  if (error) {
    console.error('Error creating paid enrollment:', error);
    return null;
  }
  return data;
}

export async function activateEnrollment(userId: string, courseId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('enrollments')
    .update({ status: 'active' })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'purchased')
    .select('id, status')
    .single();

  if (error) {
    console.error('Error activating enrollment:', error);
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

// ─── Assessment Queries ───────────────────────────────────────────────

interface AssessmentRow {
  id: string;
  title: string;
  slug: string;
  type: 'quiz' | 'assignment' | 'test';
  sort_order: number;
  description: string | null;
}

interface LessonRow {
  id: string;
  title: string;
  slug: string;
  duration_minutes: number | null;
  sort_order: number;
  is_preview: boolean;
}

export type ModuleItem =
  | { kind: 'lesson'; id: string; title: string; slug: string; sort_order: number; duration_minutes: number | null; is_preview: boolean }
  | { kind: 'assessment'; id: string; title: string; slug: string; sort_order: number; type: 'quiz' | 'assignment' | 'test'; description: string | null };

interface ModuleWithItems {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  items: ModuleItem[];
}

/**
 * Fetch a course with modules containing BOTH lessons and assessments,
 * merged into a unified sorted list per module.
 */
export async function getCourseWithModuleItems(slug: string) {
  const supabase = createServiceClient();
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id, title, slug, description, thumbnail_url, price_cents, status, estimated_duration_minutes,
      modules (
        id, title, description, sort_order,
        lessons ( id, title, slug, duration_minutes, sort_order, is_preview ),
        assessments ( id, title, slug, type, sort_order, description )
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !course) {
    console.error('Error fetching course with items:', error);
    return null;
  }

  // Sort modules, then merge + sort lessons & assessments per module
  const modules: ModuleWithItems[] = (course.modules ?? [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((m: { id: string; title: string; description: string | null; sort_order: number; lessons?: LessonRow[]; assessments?: AssessmentRow[] }) => {
      const lessonItems: ModuleItem[] = (m.lessons ?? []).map((l) => ({
        kind: 'lesson' as const,
        id: l.id,
        title: l.title,
        slug: l.slug,
        sort_order: l.sort_order,
        duration_minutes: l.duration_minutes,
        is_preview: l.is_preview,
      }));

      const assessmentItems: ModuleItem[] = (m.assessments ?? []).map((a) => ({
        kind: 'assessment' as const,
        id: a.id,
        title: a.title,
        slug: a.slug,
        sort_order: a.sort_order,
        type: a.type,
        description: a.description,
      }));

      const items = [...lessonItems, ...assessmentItems].sort(
        (a, b) => a.sort_order - b.sort_order
      );

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        sort_order: m.sort_order,
        items,
      };
    });

  return { ...course, modules };
}

/**
 * Fetch a single assessment by its slug within a course.
 */
export async function getAssessmentBySlug(courseSlug: string, assessmentSlug: string) {
  const supabase = createServiceClient();

  // First get the course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single();

  if (!course) return null;

  // Get modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', course.id);

  if (!modules?.length) return null;

  const moduleIds = modules.map((m) => m.id);

  // Get the assessment
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select('id, module_id, type, title, slug, description, instructions, questions, passing_score, max_retakes, sort_order')
    .eq('slug', assessmentSlug)
    .in('module_id', moduleIds)
    .single();

  if (error || !assessment) return null;

  return { course, assessment };
}

/**
 * Get user's best score per assessment for a course.
 * Returns a map of assessmentId → best score (or null if not attempted).
 */
export async function getUserAssessmentScores(
  userId: string,
  assessmentIds: string[]
): Promise<Record<string, number | null>> {
  if (assessmentIds.length === 0) return {};

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('assessment_submissions')
    .select('assessment_id, score, status')
    .eq('user_id', userId)
    .in('assessment_id', assessmentIds)
    .eq('status', 'graded');

  const scores: Record<string, number | null> = {};
  for (const id of assessmentIds) scores[id] = null;

  if (data) {
    for (const sub of data) {
      const current = scores[sub.assessment_id];
      if (current === null || (sub.score !== null && sub.score > current)) {
        scores[sub.assessment_id] = sub.score;
      }
    }
  }

  return scores;
}

/**
 * Get all assessment submissions for a user, grouped by course.
 * Used by the submissions dashboard.
 */
export async function getUserAllSubmissions(userId: string) {
  const supabase = createServiceClient();

  const { data: submissions, error } = await supabase
    .from('assessment_submissions')
    .select(`
      id, assessment_id, attempt_number, score, status, created_at, graded_at,
      assessments (
        id, title, type, slug,
        modules (
          id, title,
          courses ( id, title, slug )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user submissions:', error);
    return [];
  }

  return submissions ?? [];
}

/**
 * Get the count of existing submissions for a user + assessment.
 */
export async function getSubmissionCount(userId: string, assessmentId: string): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from('assessment_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('assessment_id', assessmentId);

  return count ?? 0;
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
