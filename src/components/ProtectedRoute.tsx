import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { firebaseUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { firebaseUser, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 pt-28 pb-16 text-center">
        <p className="text-espresso/60">You don't have access to this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
