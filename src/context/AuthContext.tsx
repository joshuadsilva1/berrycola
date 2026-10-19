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
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  profileCompleted?: boolean;
  isAdmin: boolean;
}

export function isProfileComplete(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.profileCompleted &&
      profile.name?.trim() &&
      profile.email?.trim() &&
      profile.phone?.trim() &&
      profile.address?.trim() &&
      profile.city?.trim() &&
      profile.pincode?.trim()
  );
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: Profile | null;
  user: Profile | null;
  loading: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  startPhoneSignIn: (phoneNumber: string, recaptchaContainerId: string) => Promise<void>;
  confirmPhoneCode: (code: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateLocalProfile: (patch: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const PROFILE_CACHE_KEY = "bc-auth-profile";

function loadCachedProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function saveCachedProfile(profile: Profile | null) {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function mergeProfile(server: Profile, cached: Profile | null): Profile {
  if (!cached) return server;
  const merged: Profile = {
    ...cached,
    ...server,
    name: server.name || cached.name || null,
    email: server.email || cached.email || null,
    phone: server.phone || cached.phone || null,
    address: server.address || cached.address || null,
    city: server.city || cached.city || null,
    state: server.state || cached.state || null,
    pincode: server.pincode || cached.pincode || null,
  };
  merged.profileCompleted = Boolean(
    server.profileCompleted ||
      (merged.name && merged.email && merged.phone && merged.address && merged.city && merged.pincode)
  );
  return merged;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() =>
    firebaseReady ? auth.currentUser : null
  );
  const [profile, setProfile] = useState<Profile | null>(() => loadCachedProfile());
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
        const cached = loadCachedProfile();
        if (cached) {
          setProfile(cached);
        }
        try {
          const synced = (await syncSession()) as Profile;
          const merged = mergeProfile(synced, cached);
          setProfile(merged);
          saveCachedProfile(merged);
        } catch {
          // Keep cached profile or build a fallback from Firebase user so login persists
          // even during backend cold starts on Render.
          const fallback: Profile = cached ?? {
            id: user.uid,
            email: user.email ?? null,
            phone: user.phoneNumber ?? null,
            name: user.displayName ?? null,
            isAdmin: false,
          };
          setProfile(fallback);
        }
      } else {
        setProfile(null);
        saveCachedProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setAnalyticsEnabled(!profile?.isAdmin);
  }, [profile]);

  const updateLocalProfile = (patch: Partial<Profile>) => {
    setProfile((prev) => {
      const base: Profile = prev ?? {
        id: firebaseUser?.uid ?? "local",
        email: firebaseUser?.email ?? null,
        phone: firebaseUser?.phoneNumber ?? null,
        name: firebaseUser?.displayName ?? null,
        isAdmin: false,
      };
      const next: Profile = { ...base, ...patch };
      next.profileCompleted = Boolean(
        next.name?.trim() &&
          next.email?.trim() &&
          next.phone?.trim() &&
          next.address?.trim() &&
          next.city?.trim() &&
          next.pincode?.trim()
      );
      saveCachedProfile(next);
      return next;
    });
  };

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    try {
      const me = (await fetchMe()) as Profile;
      const merged = mergeProfile(me, loadCachedProfile());
      setProfile(merged);
      saveCachedProfile(merged);
    } catch {
      // Keep current cached profile if server is unreachable
    }
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
    track("sign_in", { props: { method: "google" } });
  };

  const clearRecaptcha = () => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      // Already cleared, or its container left the page, nothing to clean up.
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
        user: profile,
        loading,
        firebaseReady,
        signInWithGoogle,
        startPhoneSignIn,
        confirmPhoneCode,
        signOutUser,
        logOut: signOutUser,
        refreshProfile,
        updateLocalProfile,
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
