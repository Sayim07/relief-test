import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

// Validate Firebase configuration
if (typeof window !== 'undefined') {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

  if (missingFields.length > 0) {
    console.warn('⚠️ Firebase configuration incomplete. Missing:', missingFields.join(', '));
    console.warn('Please check your .env.local file has all Firebase configuration values.');
  }
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
const app: FirebaseApp = initializeApp(firebaseConfig);

export const auth: Auth = isFirebaseConfigured ? getAuth(app) : (null as unknown as Auth);
export const db: Firestore = isFirebaseConfigured ? getFirestore(app) : (null as unknown as Firestore);
export const storage: FirebaseStorage = isFirebaseConfigured ? getStorage(app) : (null as unknown as FirebaseStorage);
export default app;
