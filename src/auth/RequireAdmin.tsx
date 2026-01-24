import * as React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { isCurrentUserAdmin } from "@/auth/admin";
import { supabase } from "@/integrations/supabase/client";

export function RequireAdmin() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!session) {
        setChecking(false);
        setIsAdmin(false);
        return;
      }

      setChecking(true);
      const ok = await isCurrentUserAdmin();
      if (cancelled) return;
      setIsAdmin(ok);
      setChecking(false);

      // Non-admin users are not allowed in this system.
      if (!ok) await supabase.auth.signOut();
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (loading || checking) {
    return (
      <div className="min-h-svh bg-background bg-brand-glow">
        <div className="mx-auto flex min-h-svh max-w-3xl items-center justify-center p-6">
          <div className="w-full rounded-xl border bg-card p-6 shadow-elev">
            <div className="h-6 w-40 rounded-md bg-muted" />
            <div className="mt-4 h-4 w-72 rounded-md bg-muted" />
            <div className="mt-6 grid gap-3">
              <div className="h-10 rounded-md bg-muted" />
              <div className="h-10 rounded-md bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!isAdmin) return <Navigate to="/login" replace />;

  return <Outlet />;
}
