import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/queries';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contentBlockId = searchParams.get('contentBlockId');

  if (!contentBlockId) {
    return NextResponse.json(
      { error: 'Missing contentBlockId' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('id, answers, score, feedback, status, created_at, graded_at')
    .eq('user_id', user.uid)
    .eq('content_block_id', contentBlockId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[submission] Fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }

  return NextResponse.json({ submission: data });
}
