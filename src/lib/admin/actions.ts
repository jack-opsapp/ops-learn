'use server';

import { createServiceClient } from '@/lib/supabase/server';
import type {
  CourseOverview,
  CourseDetail,
  CourseAnalytics,
  VanityMetrics,
} from './types';

// ─── Course List ─────────────────────────────────────────────────────

export async function getCourseList(): Promise<CourseOverview[]> {
  const supabase = createServiceClient();

  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id, title, slug, status, price_cents, sort_order,
      display_enrollments, display_rating, display_review_count,
      modules (
        id,
        lessons ( id ),
        assessments ( id )
      )
    `)
    .order('sort_order');

  if (error) {
    console.error('Admin getCourseList error:', error);
    return [];
  }

  // Get enrollment counts per course
  const courseIds = (courses ?? []).map((c) => c.id);
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, status')
    .in('course_id', courseIds);

  const enrollmentMap = new Map<string, { enrolled: number; completed: number }>();
  for (const e of enrollments ?? []) {
    const entry = enrollmentMap.get(e.course_id) ?? { enrolled: 0, completed: 0 };
    entry.enrolled++;
    if (e.status === 'completed') entry.completed++;
    enrollmentMap.set(e.course_id, entry);
  }

  return (courses ?? []).map((c) => {
    const modules = c.modules ?? [];
    const lesson_count = modules.reduce(
      (acc: number, m: { lessons?: { id: string }[] }) => acc + (m.lessons?.length ?? 0),
      0
    );
    const assessment_count = modules.reduce(
      (acc: number, m: { assessments?: { id: string }[] }) => acc + (m.assessments?.length ?? 0),
      0
    );
    const counts = enrollmentMap.get(c.id) ?? { enrolled: 0, completed: 0 };

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      price_cents: c.price_cents,
      sort_order: c.sort_order,
      module_count: modules.length,
      lesson_count,
      assessment_count,
      enrolled_count: counts.enrolled,
      completed_count: counts.completed,
      display_enrollments: c.display_enrollments ?? 0,
      display_rating: Number(c.display_rating ?? 0),
      display_review_count: c.display_review_count ?? 0,
    };
  });
}

// ─── Course Detail ───────────────────────────────────────────────────

export async function getCourseDetail(courseId: string): Promise<CourseDetail | null> {
  const supabase = createServiceClient();

  // 1. Course row
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('id, title, slug, status, price_cents, display_enrollments, display_rating, display_review_count')
    .eq('id', courseId)
    .single();

  if (courseErr || !course) return null;

  // 2. Modules ordered
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, sort_order')
    .eq('course_id', courseId)
    .order('sort_order');

  const moduleIds = (modules ?? []).map((m) => m.id);

  // 3. Lessons with content block type counts
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, slug, duration_minutes, sort_order, module_id, content_blocks ( type )')
    .in('module_id', moduleIds)
    .order('sort_order');

  // 4. Assessments with question counts
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, slug, type, sort_order, passing_score, questions, module_id')
    .in('module_id', moduleIds)
    .order('sort_order');

  // Assemble modules with their lessons and assessments
  const assembledModules = (modules ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    sort_order: m.sort_order,
    lessons: (lessons ?? [])
      .filter((l) => l.module_id === m.id)
      .map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        duration_minutes: l.duration_minutes,
        sort_order: l.sort_order,
        content_blocks: (l.content_blocks ?? []).map((cb: { type: string }) => ({ type: cb.type })),
      })),
    assessments: (assessments ?? [])
      .filter((a) => a.module_id === m.id)
      .map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        type: a.type as 'quiz' | 'assignment' | 'test',
        sort_order: a.sort_order,
        passing_score: a.passing_score,
        question_count: Array.isArray(a.questions) ? a.questions.length : 0,
      })),
  }));

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    status: course.status,
    price_cents: course.price_cents,
    display_enrollments: course.display_enrollments ?? 0,
    display_rating: Number(course.display_rating ?? 0),
    display_review_count: course.display_review_count ?? 0,
    modules: assembledModules,
  };
}

// ─── Analytics ───────────────────────────────────────────────────────

export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
  const supabase = createServiceClient();

  // 1. Enrollment counts
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('status')
    .eq('course_id', courseId);

  const total = enrollments?.length ?? 0;
  const active = enrollments?.filter((e) => e.status === 'active').length ?? 0;
  const completed = enrollments?.filter((e) => e.status === 'completed').length ?? 0;

  // 2. Lesson-level progress
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, sort_order')
    .eq('course_id', courseId)
    .order('sort_order');

  const moduleIds = (modules ?? []).map((m) => m.id);

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, sort_order, module_id')
    .in('module_id', moduleIds)
    .order('sort_order');

  const lessonIds = (lessons ?? []).map((l) => l.id);

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status')
    .in('lesson_id', lessonIds);

  const progressMap = new Map<string, { started: number; completed: number }>();
  for (const p of progress ?? []) {
    const entry = progressMap.get(p.lesson_id) ?? { started: 0, completed: 0 };
    entry.started++;
    if (p.status === 'completed') entry.completed++;
    progressMap.set(p.lesson_id, entry);
  }

  const moduleMap = new Map((modules ?? []).map((m) => [m.id, m]));

  const lesson_progress = (lessons ?? []).map((l) => {
    const mod = moduleMap.get(l.module_id);
    const counts = progressMap.get(l.id) ?? { started: 0, completed: 0 };
    return {
      lesson_id: l.id,
      lesson_title: l.title,
      module_title: mod?.title ?? '',
      module_sort_order: mod?.sort_order ?? 0,
      lesson_sort_order: l.sort_order,
      started_count: counts.started,
      completed_count: counts.completed,
    };
  });

  // 3. Assessment stats
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, type')
    .in('module_id', moduleIds);

  const assessmentIds = (assessments ?? []).map((a) => a.id);

  const { data: submissions } = await supabase
    .from('assessment_submissions')
    .select('assessment_id, score, status')
    .in('assessment_id', assessmentIds)
    .eq('status', 'graded');

  const subMap = new Map<string, { scores: number[]; passed: number }>();
  for (const s of submissions ?? []) {
    const entry = subMap.get(s.assessment_id) ?? { scores: [], passed: 0 };
    if (s.score !== null) {
      entry.scores.push(s.score);
      if (s.score >= 70) entry.passed++;
    }
    subMap.set(s.assessment_id, entry);
  }

  const assessment_stats = (assessments ?? []).map((a) => {
    const stats = subMap.get(a.id) ?? { scores: [], passed: 0 };
    const count = stats.scores.length;
    return {
      assessment_id: a.id,
      assessment_title: a.title,
      type: a.type,
      submission_count: count,
      pass_count: stats.passed,
      pass_rate: count > 0 ? Math.round((stats.passed / count) * 100) : 0,
      avg_score: count > 0 ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / count) : 0,
    };
  });

  return {
    enrollment: {
      total,
      active,
      completed,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
    lesson_progress,
    assessment_stats,
  };
}

// ─── Vanity Metrics Update ───────────────────────────────────────────

export async function updateVanityMetrics(
  courseId: string,
  metrics: VanityMetrics
): Promise<{ success: boolean; error?: string }> {
  // Validate
  if (metrics.display_enrollments < 0) {
    return { success: false, error: 'Enrollments must be ≥ 0' };
  }
  if (metrics.display_rating < 0 || metrics.display_rating > 5) {
    return { success: false, error: 'Rating must be 0.0–5.0' };
  }
  if (metrics.display_review_count < 0) {
    return { success: false, error: 'Review count must be ≥ 0' };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('courses')
    .update({
      display_enrollments: metrics.display_enrollments,
      display_rating: metrics.display_rating,
      display_review_count: metrics.display_review_count,
    })
    .eq('id', courseId);

  if (error) {
    console.error('Update vanity metrics error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
