import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD09FaoseAhINt-oJg9ASmauqrmUwEDx40",
  authDomain: "medical-room.firebaseapp.com",
  projectId: "medical-room",
  storageBucket: "medical-room.firebasestorage.app",
  messagingSenderId: "44693061951",
  appId: "1:44693061951:web:5e3b2368b09b772345938a"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary app instance for admin to create users without signing themselves out
export function getSecondaryAuth() {
  const existing = getApps().find(a => a.name === 'secondary');
  const secondaryApp = existing || initializeApp(firebaseConfig, 'secondary');
  return getAuth(secondaryApp);
}
