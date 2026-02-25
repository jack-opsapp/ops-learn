import { createServiceClient } from '@/lib/supabase/server';

/**
 * Recalculate the overall course grade for a user.
 * Called after each assessment is graded.
 *
 * Logic:
 * 1. Get all assessments for this course (via modules)
 * 2. For each assessment, get the user's best graded submission score
 * 3. Calculate weighted average (by total points per assessment)
 * 4. Upsert into course_grades table
 */
export async function recalculateCourseGrade(userId: string, courseId: string) {
  const supabase = createServiceClient();

  // Get all modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId);

  if (!modules?.length) return;

  const moduleIds = modules.map((m) => m.id);

  // Get all assessments for these modules
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id')
    .in('module_id', moduleIds);

  if (!assessments?.length) return;

  const assessmentIds = assessments.map((a) => a.id);
  const assessmentCount = assessmentIds.length;

  // Get user's best graded submission per assessment
  const { data: submissions } = await supabase
    .from('assessment_submissions')
    .select('assessment_id, score')
    .eq('user_id', userId)
    .eq('status', 'graded')
    .in('assessment_id', assessmentIds);

  // Find best score per assessment
  const bestScores: Record<string, number> = {};
  if (submissions) {
    for (const sub of submissions) {
      if (sub.score !== null) {
        const current = bestScores[sub.assessment_id];
        if (current === undefined || sub.score > current) {
          bestScores[sub.assessment_id] = sub.score;
        }
      }
    }
  }

  const gradedCount = Object.keys(bestScores).length;

  // Calculate overall score as average of best scores
  let overallScore: number | null = null;
  if (gradedCount > 0) {
    const totalScore = Object.values(bestScores).reduce((sum, s) => sum + s, 0);
    overallScore = Math.round((totalScore / gradedCount) * 100) / 100;
  }

  // Upsert into course_grades
  const { error } = await supabase
    .from('course_grades')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        overall_score: overallScore,
        assessment_count: assessmentCount,
        graded_count: gradedCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    );

  if (error) {
    console.error('[course-grade] Upsert failed:', error);
  }
}
