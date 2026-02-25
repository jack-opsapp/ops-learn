import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/queries';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assessmentId, answers } = await request.json();

  if (!assessmentId || !answers) {
    return NextResponse.json(
      { error: 'Missing assessmentId or answers' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Verify the assessment exists and get max_retakes
  const { data: assessment, error: assessErr } = await supabase
    .from('assessments')
    .select('id, max_retakes')
    .eq('id', assessmentId)
    .single();

  if (assessErr || !assessment) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    );
  }

  // Count existing submissions
  const { count } = await supabase
    .from('assessment_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.uid)
    .eq('assessment_id', assessmentId);

  const existingCount = count ?? 0;

  if (existingCount >= assessment.max_retakes) {
    return NextResponse.json(
      { error: 'Max retakes reached' },
      { status: 400 }
    );
  }

  const attemptNumber = existingCount + 1;

  // Insert submission
  const { data: submission, error } = await supabase
    .from('assessment_submissions')
    .insert({
      user_id: user.uid,
      assessment_id: assessmentId,
      attempt_number: attemptNumber,
      answers,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[assessments/submit] Insert failed:', error);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    submissionId: submission.id,
    attemptNumber,
  });
}
