import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';

/** UI guard only: the API must independently authorize every private endpoint. */
export default function ProtectedRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p role="status">Checking session…</p>;
  if (!user) return <>{fallback ?? <p>Please log in to continue.</p>}</>;
  return <>{children}</>;
}
