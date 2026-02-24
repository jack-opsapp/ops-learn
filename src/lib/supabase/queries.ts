import { createClient } from './server';

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
