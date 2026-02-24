import { createClient } from './server';

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserEnrollment(userId: string, courseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  return data;
}

export async function enrollInFreeCourse(userId: string, courseId: string) {
  const supabase = await createClient();
  // Check if already enrolled
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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

  // Sort modules and lessons by sort_order
  if (data?.modules) {
    data.modules.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    data.modules.forEach((m: { lessons?: { sort_order: number }[] }) => {
      m.lessons?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    });
  }

  return data;
}

export async function getContentBlocksByLessonId(lessonId: string) {
  const supabase = await createClient();
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
  const supabase = await createClient();

  // First get the course to verify it's published
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('slug', courseSlug)
    .eq('status', 'published')
    .single();

  if (!course) return null;

  // Get the lesson with content blocks
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

  // Sort content blocks
  if (lesson?.content_blocks) {
    lesson.content_blocks.sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    );
  }

  return { course, lesson };
}
