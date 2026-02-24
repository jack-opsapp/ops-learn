import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';

const COOKIE_NAME = 'ops-learn-session';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
  }

  const decoded = await verifyIdToken(idToken);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });

  return NextResponse.json({ uid: decoded.uid });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ success: true });
}
