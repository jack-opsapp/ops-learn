import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';

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

  const { courseId, successUrl, cancelUrl } = await request.json();

  // Call the Edge Function with the service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(
    `${supabaseUrl}/functions/v1/stripe-create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        type: 'course_purchase',
        courseId,
        userId: decoded.uid,
        userEmail: decoded.email,
        successUrl,
        cancelUrl,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.error || 'Checkout failed' }, { status: res.status });
  }

  return NextResponse.json(data);
}
