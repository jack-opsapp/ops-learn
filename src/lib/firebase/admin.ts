import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;

/**
 * Normalize a private key from env var into proper PEM format.
 * Handles: raw base64 (no headers), literal \n, quoted strings.
 */
function parsePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let key = raw.replace(/^["']|["']$/g, '');
  key = key.replace(/\\n/g, '\n');
  if (key.includes('-----BEGIN')) return key;
  // Raw base64 body only — wrap in PEM
  const base64 = key.replace(/\s/g, '');
  const lines = base64.match(/.{1,64}/g) ?? [base64];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

function getAdminApp(): App {
  if (!_adminApp) {
    if (getApps().length > 0) {
      _adminApp = getApps()[0];
    } else {
      const privateKey = parsePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (privateKey && clientEmail) {
        _adminApp = initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } else {
        // Fallback for build time — no credential, limited functionality
        _adminApp = initializeApp({ projectId });
      }
    }
  }
  return _adminApp;
}

function getAdminAuth(): Auth {
  if (!_adminAuth) {
    _adminAuth = getAuth(getAdminApp());
  }
  return _adminAuth;
}

/**
 * Verify a Firebase ID token and return the decoded claims.
 * Returns null if the token is invalid or expired.
 */
export async function verifyIdToken(token: string) {
  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch (err) {
    console.error('[firebase-admin] verifyIdToken error:', err);
    return null;
  }
}
