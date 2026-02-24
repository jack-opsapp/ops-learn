import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;

function getAdminApp(): App {
  if (!_adminApp) {
    if (getApps().length > 0) {
      _adminApp = getApps()[0];
    } else {
      _adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
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
