import { createServiceClient } from './server';

/**
 * Get the challenge quiz for a course (if one exists).
 */
export async function getCourseChallenge(courseId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('course_challenges')
    .select('id, course_id, title, description, questions, passing_score, discount_tiers')
    .eq('course_id', courseId)
    .maybeSingle();
  return data;
}

/**
 * Get a user's challenge attempt for a specific challenge.
 * Returns null if they haven't attempted it.
 */
export async function getChallengeAttempt(challengeId: string, userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('challenge_attempts')
    .select('id, score, feedback, discount_percentage, discount_code, status, created_at, graded_at')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

/**
 * Mark a challenge attempt as converted (user purchased the course).
 */
export async function markChallengeConverted(challengeId: string, userId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('challenge_attempts')
    .update({
      converted: true,
      converted_at: new Date().toISOString(),
    })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking challenge converted:', error);
  }
}
