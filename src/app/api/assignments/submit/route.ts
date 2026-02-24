import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/queries';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { contentBlockId, answers } = await request.json();

  if (!contentBlockId || !answers) {
    return NextResponse.json(
      { error: 'Missing contentBlockId or answers' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Verify the content block exists and is an assignment
  const { data: block, error: blockErr } = await supabase
    .from('content_blocks')
    .select('id, type')
    .eq('id', contentBlockId)
    .single();

  if (blockErr || !block || block.type !== 'assignment') {
    return NextResponse.json(
      { error: 'Invalid assignment block' },
      { status: 400 }
    );
  }

  // Insert submission
  const { data: submission, error } = await supabase
    .from('assignment_submissions')
    .insert({
      user_id: user.uid,
      content_block_id: contentBlockId,
      answers,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[submit] Insert failed:', error);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }

  return NextResponse.json({ submissionId: submission.id });
}
