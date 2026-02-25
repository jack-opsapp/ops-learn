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

  const { courseId, successUrl, cancelUrl, promoCode } = await request.json();

  // Call the Edge Function with the service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

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
        promoCode,
      }),
    }
  );

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('[checkout] Edge Function returned non-JSON:', res.status, text.slice(0, 500));
    return NextResponse.json({ error: `Edge Function error (${res.status}): ${text.slice(0, 200)}` }, { status: 502 });
  }

  if (!res.ok) {
    console.error('[checkout] Edge Function error:', res.status, data);
    return NextResponse.json({ error: data.error || 'Checkout failed' }, { status: res.status });
  }

  return NextResponse.json(data);
}
