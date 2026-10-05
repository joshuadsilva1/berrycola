import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!firebaseReady) {
  console.warn(
    "Firebase env vars are missing — login is disabled until VITE_FIREBASE_* is set in .env (see .env.example)."
  );
}

// Only touch the Firebase SDK when real config is present — getAuth() throws
// synchronously on an invalid/missing api key, which would otherwise crash
// the whole app on load before Firebase is set up.
export const auth: Auth = firebaseReady
  ? getAuth(initializeApp(firebaseConfig))
  : (new Proxy(
      {},
      {
        get() {
          throw new Error("Firebase isn't configured — set VITE_FIREBASE_* in .env first.");
        },
      }
    ) as Auth);
