import { NextResponse } from 'next/server';

export async function GET() {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  return NextResponse.json({
    hasPrivateKey: !!privateKey,
    privateKeyLength: privateKey?.length ?? 0,
    privateKeyStart: privateKey?.substring(0, 30) ?? 'MISSING',
    hasBeginHeader: privateKey?.includes('-----BEGIN') ?? false,
    hasLiteralNewlines: privateKey?.includes('\\n') ?? false,
    hasRealNewlines: privateKey?.includes('\n') ?? false,
    clientEmail: clientEmail ?? 'MISSING',
    projectId: projectId ?? 'MISSING',
  });
}
