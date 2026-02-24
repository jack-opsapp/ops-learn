import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;

function getAdminApp(): App {
  if (!_adminApp) {
    if (getApps().length > 0) {
      _adminApp = getApps()[0];
    } else {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (privateKey && clientEmail) {
        _adminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
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
  } catch {
    return null;
  }
}
