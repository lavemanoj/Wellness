// src/firebase.js
// Firebase configuration for Self Wellness Platform

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBG5q0UtvanH300gPEuRiY45bF-D5pPO1s",
  authDomain: "hr-pro-7328a.firebaseapp.com",
  projectId: "hr-pro-7328a",
  storageBucket: "hr-pro-7328a.firebasestorage.app",
  messagingSenderId: "310386289733",
  appId: "1:310386289733:web:77b01c1d3dced54b1b472c",
  measurementId: "G-6LNE7T38DJ"
};

// Reuse existing app on hot-reload to avoid duplicate-app error
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only when the browser supports it
isSupported().then((yes) => { if (yes) getAnalytics(app); }).catch(() => {});

// Initialize db safely with IndexedDB offline persistence, falling back to existing instance on hot-reload
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  dbInstance = getFirestore(app);
}

// Core services
export const auth    = getAuth(app);
export const db      = dbInstance;
export const storage = getStorage(app);

export default app;
