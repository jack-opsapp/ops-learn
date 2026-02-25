import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/queries';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const assessmentId = searchParams.get('assessmentId');
  const all = searchParams.get('all');

  const supabase = createServiceClient();

  // If `all=true`, fetch all submissions with assessment details (for dashboard)
  if (all === 'true') {
    const { data, error } = await supabase
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
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[assessments/submissions] Fetch all failed:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ submissions: data ?? [] });
  }

  // Single assessment submissions
  if (!assessmentId) {
    return NextResponse.json(
      { error: 'Missing assessmentId' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('assessment_submissions')
    .select('id, attempt_number, answers, score, feedback, status, created_at, graded_at')
    .eq('user_id', user.uid)
    .eq('assessment_id', assessmentId)
    .order('attempt_number', { ascending: false });

  if (error) {
    console.error('[assessments/submissions] Fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }

  return NextResponse.json({ submissions: data ?? [] });
}
