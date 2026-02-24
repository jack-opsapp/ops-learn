import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/queries';
import { createServiceClient } from '@/lib/supabase/server';
import { gradeAssignment, type AssignmentContent } from '@/lib/grading';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { submissionId } = await request.json();

  if (!submissionId) {
    return NextResponse.json(
      { error: 'Missing submissionId' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Fetch the submission
  const { data: submission, error: subErr } = await supabase
    .from('assignment_submissions')
    .select('id, user_id, content_block_id, answers, status')
    .eq('id', submissionId)
    .single();

  if (subErr || !submission) {
    return NextResponse.json(
      { error: 'Submission not found' },
      { status: 404 }
    );
  }

  // Only the owner can grade their own submission
  if (submission.user_id !== user.uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Don't re-grade already graded submissions
  if (submission.status === 'graded') {
    return NextResponse.json(
      { error: 'Already graded' },
      { status: 400 }
    );
  }

  // Fetch the content block to get questions + rubric
  const { data: block, error: blockErr } = await supabase
    .from('content_blocks')
    .select('content')
    .eq('id', submission.content_block_id)
    .single();

  if (blockErr || !block) {
    return NextResponse.json(
      { error: 'Content block not found' },
      { status: 404 }
    );
  }

  try {
    const result = await gradeAssignment(
      block.content as unknown as AssignmentContent,
      submission.answers as Record<string, unknown>
    );

    // Compute percentage score (0-100)
    const percentScore =
      result.maxScore > 0
        ? Math.round((result.totalScore / result.maxScore) * 100)
        : 0;

    // Update submission with grading results
    const { error: updateErr } = await supabase
      .from('assignment_submissions')
      .update({
        score: percentScore,
        feedback: result.questionFeedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateErr) {
      console.error('[grade] Update failed:', updateErr);
      return NextResponse.json(
        { error: 'Failed to save grading results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      score: percentScore,
      feedback: result.questionFeedback,
      status: 'graded',
    });
  } catch (err) {
    console.error('[grade] Grading failed:', err);

    // Mark submission as error
    await supabase
      .from('assignment_submissions')
      .update({ status: 'error' })
      .eq('id', submissionId);

    return NextResponse.json(
      { error: 'Grading failed' },
      { status: 500 }
    );
  }
}
