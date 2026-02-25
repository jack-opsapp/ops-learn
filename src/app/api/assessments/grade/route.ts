import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/queries';
import { createServiceClient } from '@/lib/supabase/server';
import { gradeAssignment, type AssignmentContent } from '@/lib/grading';
import { recalculateCourseGrade } from '@/lib/course-grade';

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
    .from('assessment_submissions')
    .select('id, user_id, assessment_id, answers, status')
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

  // Fetch the assessment to get questions + rubric
  const { data: assessment, error: assessErr } = await supabase
    .from('assessments')
    .select('id, title, instructions, questions, module_id')
    .eq('id', submission.assessment_id)
    .single();

  if (assessErr || !assessment) {
    return NextResponse.json(
      { error: 'Assessment not found' },
      { status: 404 }
    );
  }

  try {
    // Reuse gradeAssignment from grading.ts — it works with any question array
    const content: AssignmentContent = {
      title: assessment.title,
      instructions: assessment.instructions ?? '',
      questions: assessment.questions as AssignmentContent['questions'],
    };

    const result = await gradeAssignment(
      content,
      submission.answers as Record<string, unknown>
    );

    // Compute percentage score (0-100)
    const percentScore =
      result.maxScore > 0
        ? Math.round((result.totalScore / result.maxScore) * 100)
        : 0;

    // Update submission with grading results
    const { error: updateErr } = await supabase
      .from('assessment_submissions')
      .update({
        score: percentScore,
        feedback: result.questionFeedback,
        status: 'graded',
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateErr) {
      console.error('[assessments/grade] Update failed:', updateErr);
      return NextResponse.json(
        { error: 'Failed to save grading results' },
        { status: 500 }
      );
    }

    // Recalculate course grade
    // Get course_id from module
    const { data: module } = await supabase
      .from('modules')
      .select('course_id')
      .eq('id', assessment.module_id)
      .single();

    if (module?.course_id) {
      await recalculateCourseGrade(user.uid, module.course_id);
    }

    return NextResponse.json({
      score: percentScore,
      feedback: result.questionFeedback,
      status: 'graded',
    });
  } catch (err) {
    console.error('[assessments/grade] Grading failed:', err);

    // Mark submission as error
    await supabase
      .from('assessment_submissions')
      .update({ status: 'error' })
      .eq('id', submissionId);

    return NextResponse.json(
      { error: 'Grading failed' },
      { status: 500 }
    );
  }
}
