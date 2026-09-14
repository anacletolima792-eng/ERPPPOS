import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration from Firebase provisioning
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore safely across all browsers and iframe environments
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db = getFirestore(app, firestoreDbId);

export { firebaseConfig };




