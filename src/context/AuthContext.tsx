import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  onIdTokenChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  type ConfirmationResult,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, firebaseReady } from "../lib/firebase";
import { fetchMe, syncSession } from "../lib/api";
import { setAnalyticsEnabled, track } from "../lib/analytics";

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  isAdmin: boolean;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  startPhoneSignIn: (phoneNumber: string, recaptchaContainerId: string) => Promise<void>;
  confirmPhoneCode: (code: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const synced = (await syncSession()) as Profile;
          setProfile(synced);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setAnalyticsEnabled(!profile?.isAdmin);
  }, [profile]);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    const me = (await fetchMe()) as Profile;
    setProfile(me);
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
    track("sign_in", { props: { method: "google" } });
  };

  const clearRecaptcha = () => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      // Already cleared, or its container left the page — nothing to clean up.
    }
    recaptchaRef.current = null;
  };

  const startPhoneSignIn = async (phoneNumber: string, recaptchaContainerId: string) => {
    // Build a fresh invisible reCAPTCHA for every attempt: a token can't be
    // reused after a failed send, and the old widget may belong to a login
    // page that has since unmounted. Rendering into a new child element
    // avoids "reCAPTCHA has already been rendered in this element".
    clearRecaptcha();
    const container = document.getElementById(recaptchaContainerId);
    if (!container) throw new Error(`#${recaptchaContainerId} is not on the page`);
    container.replaceChildren();
    const host = document.createElement("div");
    container.appendChild(host);

    const verifier = new RecaptchaVerifier(auth, host, { size: "invisible" });
    recaptchaRef.current = verifier;
    try {
      confirmationRef.current = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    } catch (err) {
      clearRecaptcha();
      throw err;
    }
  };

  const confirmPhoneCode = async (code: string) => {
    if (!confirmationRef.current) {
      throw new Error("Request a code before confirming it.");
    }
    await confirmationRef.current.confirm(code);
    track("sign_in", { props: { method: "phone" } });
    confirmationRef.current = null;
    clearRecaptcha();
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        firebaseReady,
        signInWithGoogle,
        startPhoneSignIn,
        confirmPhoneCode,
        signOutUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
