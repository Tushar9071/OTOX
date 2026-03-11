import * as admin from "firebase-admin";
import env from "./env";

let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // Dev mode without Firebase credentials
    firebaseApp = admin.initializeApp({
      projectId: "autoriksha-dev",
    });
  }

  return firebaseApp;
}

export function getFirebaseAuth() {
  return getFirebaseAdmin().auth();
}

export function getFirebaseMessaging() {
  return getFirebaseAdmin().messaging();
}
