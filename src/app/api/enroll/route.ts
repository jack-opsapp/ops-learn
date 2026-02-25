import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';
import { createServiceClient } from '@/lib/supabase/server';

const SESSION_COOKIE = 'ops-learn-session';

export async function POST(request: Request) {
  // Verify Firebase session
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = await verifyIdToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify course exists
  const { data: course } = await supabase
    .from('courses')
    .select('id, price_cents')
    .eq('id', courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const isFree = course.price_cents === 0;

  // Check existing enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', decoded.uid)
    .eq('course_id', courseId)
    .maybeSingle();

  if (isFree) {
    // Free course: create new enrollment with status 'active'
    if (enrollment) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({ user_id: decoded.uid, course_id: courseId, status: 'active' });

    if (error) {
      console.error('[enroll] Error creating free enrollment:', error);
      return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Paid course: must have 'purchased' enrollment to activate
  if (!enrollment || enrollment.status !== 'purchased') {
    return NextResponse.json(
      { error: 'Course must be purchased first' },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'active' })
    .eq('id', enrollment.id);

  if (error) {
    console.error('[enroll] Error activating enrollment:', error);
    return NextResponse.json({ error: 'Failed to activate enrollment' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
