import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || 'meu-norte-a9aa3';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || `${projectId}.firebaseapp.com`;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || `${projectId}.firebasestorage.app`;
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId;
const appId = import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId;
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || '(default)';

export const activeProjectId = projectId;
export const activeDatabaseId = databaseId;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, databaseId);
} catch {
  // If already initialized or persistent cache is unsupported in current iframe
  dbInstance = getFirestore(app, databaseId);
}

export const db = dbInstance;
