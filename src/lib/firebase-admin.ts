import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (!getApps().length) {
  try {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin');
  }
} else {
  app = getApps()[0] as App;
}

export const adminAuth = getAuth(app);
export const adminFirestore = getFirestore(app);

export default app;
