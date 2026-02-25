import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';
import { createServiceClient } from '@/lib/supabase/server';
import { gradeAssignment } from '@/lib/grading';

const SESSION_COOKIE = 'ops-learn-session';

interface DiscountTier {
  min_score: number;
  max_score: number;
  discount_percent: number;
  stripe_coupon_id: string;
  stripe_promo_code_id: string;
  message: string;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const decoded = await verifyIdToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const { challengeId, answers } = await request.json();
  if (!challengeId || !answers) {
    return NextResponse.json({ error: 'challengeId and answers are required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch challenge
  const { data: challenge } = await supabase
    .from('course_challenges')
    .select('id, course_id, title, questions, discount_tiers')
    .eq('id', challengeId)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  // Check if user already attempted
  const { data: existing } = await supabase
    .from('challenge_attempts')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('user_id', decoded.uid)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You have already attempted this challenge' }, { status: 409 });
  }

  // Grade using existing grading library
  const gradingResult = await gradeAssignment(
    { title: challenge.title, instructions: '', questions: challenge.questions },
    answers
  );

  // Calculate percentage score
  const score = gradingResult.maxScore > 0
    ? Math.round((gradingResult.totalScore / gradingResult.maxScore) * 100)
    : 0;

  // Match discount tier
  const tiers = (challenge.discount_tiers as DiscountTier[]) || [];
  const matchedTier = tiers.find(
    (t) => score >= t.min_score && score <= t.max_score
  );

  const discountPercentage = matchedTier?.discount_percent ?? 0;
  const discountCode = matchedTier?.stripe_promo_code_id ?? null;
  const message = matchedTier?.message ?? '';

  // Insert attempt
  const { data: attempt, error: insertError } = await supabase
    .from('challenge_attempts')
    .insert({
      challenge_id: challengeId,
      user_id: decoded.uid,
      answers,
      score,
      feedback: gradingResult.questionFeedback,
      discount_percentage: discountPercentage,
      discount_code: discountCode,
      status: 'graded',
      graded_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[challenge/submit] Error inserting attempt:', insertError);
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    feedback: gradingResult.questionFeedback,
    discountPercentage,
    discountCode,
    message,
  });
}
