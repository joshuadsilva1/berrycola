import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom"; // <-- Added Navigate here
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";

// Firebase wants E.164 (+919876543210). Strip spaces/dashes and assume India
// when someone types a bare 10-digit number.
function toE164(input: string) {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  return `+${digits}`;
}

const PHONE_ERRORS: Record<string, string> = {
  "auth/invalid-phone-number": "That doesn't look like a valid phone number.",
  "auth/missing-phone-number": "Enter your phone number first.",
  "auth/too-many-requests": "Too many attempts — please wait a bit and try again.",
  "auth/quota-exceeded": "We've hit today's SMS limit — please try again later.",
  "auth/captcha-check-failed": "Security check failed — refresh the page and try again.",
  "auth/invalid-app-credential": "Security check failed — refresh the page and try again.",
  "auth/invalid-verification-code": "That code didn't match — please try again.",
  "auth/code-expired": "That code has expired — go back and request a new one.",
  // Setup problems: shown so they're obvious while configuring Firebase.
  "auth/operation-not-allowed": "Phone sign-in isn't enabled in the Firebase console yet.",
  "auth/unauthorized-domain":
    "This domain isn't in Firebase's authorized domains (open the site on localhost, not 127.0.0.1).",
  "auth/billing-not-enabled":
    "Real SMS needs the Firebase Blaze plan — use a test phone number until billing is on.",
};

function phoneErrorMessage(err: unknown, fallback: string) {
  const code = (err as { code?: string })?.code;
  if (code && PHONE_ERRORS[code]) return PHONE_ERRORS[code];
  console.error("Phone sign-in failed:", err);
  return fallback;
}

export default function Login() {
  // Added "user" to the useAuth destructuring so we can check if they are an admin
  const { firebaseReady, firebaseUser, user, signInWithGoogle, startPhoneSignIn, confirmPhoneCode } =
    useAuth();
  const location = useLocation();
  
  // Make the default route smart based on admin status
  const defaultRedirect = user?.isAdmin ? "/admin" : "/account";
  const redirectTo = (location.state as { from?: string } | null)?.from ?? defaultRedirect;
  const [mode, setMode] = useState<"choose" | "phone" | "otp">("choose");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // --- THE FIX IS HERE ---
  // If the user is already logged in, safely redirect them using the Navigate component
  if (firebaseUser) {
    return <Navigate to={redirectTo} replace />;
  }
  // -----------------------

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("Couldn't sign in with Google — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await startPhoneSignIn(toE164(phone), RECAPTCHA_CONTAINER_ID);
      setCode("");
      setMode("otp");
    } catch (err) {
      setError(phoneErrorMessage(err, "Couldn't send a code to that number — check it and try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await confirmPhoneCode(code.trim());
    } catch (err) {
      setError(phoneErrorMessage(err, "That code didn't match — please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-cream border border-espresso/10 rounded-3xl shadow-xl p-8"
      >
        <h1 className="font-display text-2xl text-espresso text-center mb-1">Welcome back</h1>
        <p className="text-sm text-espresso/60 text-center mb-7">
          Sign in to check out and track your orders.
        </p>

        {!firebaseReady && (
          <p className="text-xs text-cola-red bg-cola-red/10 rounded-xl px-4 py-3 mb-5">
            Login isn't configured yet — add your Firebase project keys to the frontend
            .env file to enable this.
          </p>
        )}

        {error && (
          <p className="text-xs text-cola-red bg-cola-red/10 rounded-xl px-4 py-3 mb-5">{error}</p>
        )}

        {mode === "choose" && (
          <div className="flex flex-col gap-3">
            <button
              disabled={busy || !firebaseReady}
              onClick={handleGoogle}
              className="w-full py-3.5 rounded-full border border-espresso/15 font-semibold text-sm flex items-center justify-center gap-2 hover:border-cola-red hover:text-cola-red transition-colors disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              disabled={!firebaseReady}
              onClick={() => setMode("phone")}
              className="w-full py-3.5 rounded-full bg-cola-red text-cream font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cola-red-dark transition-colors disabled:opacity-50"
            >
              <Phone size={16} />
              Continue with phone
            </button>
          </div>
        )}

        {mode === "phone" && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="text-xs text-espresso/50 hover:text-cola-red self-start"
            >
              ← Back
            </button>
            <input
              required
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-espresso/15 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-cola-red bg-cream"
            />
            <p className="text-[11px] text-espresso/40 -mt-1">
              Include your country code, e.g. +91 for India.
            </p>
            <button
              disabled={busy}
              className="w-full py-3.5 rounded-full bg-cola-red text-cream font-semibold text-sm hover:bg-cola-red-dark transition-colors disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {mode === "otp" && (
          <form onSubmit={handleConfirmCode} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setMode("phone")}
              className="text-xs text-espresso/50 hover:text-cola-red self-start"
            >
              ← Back
            </button>
            <p className="text-xs text-espresso/60">Enter the code we texted to {toE164(phone)}.</p>
            <input
              required
              inputMode="numeric"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border border-espresso/15 rounded-2xl px-4 py-3 text-sm tracking-[0.3em] text-center focus:outline-none focus:border-cola-red bg-cream"
            />
            <button
              disabled={busy}
              className="w-full py-3.5 rounded-full bg-cola-red text-cream font-semibold text-sm hover:bg-cola-red-dark transition-colors disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Verify & sign in"}
            </button>
          </form>
        )}

        <div id={RECAPTCHA_CONTAINER_ID} />
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.5 0-14 4.2-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4c-2 1.5-4.6 2.4-7.5 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 39.8 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.4C41.5 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}