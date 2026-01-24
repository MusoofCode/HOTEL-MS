import * as React from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [loading, setLoading] = React.useState(true);
  const [hasAdmin, setHasAdmin] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("setup-admin", { method: "GET" });
      if (cancelled) return;
      if (error) {
        setHasAdmin(false);
      } else {
        setHasAdmin(Boolean((data as any)?.hasAdmin));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || hasAdmin === null) {
    return (
      <div className="min-h-svh bg-background bg-brand-glow">
        <div className="mx-auto flex min-h-svh max-w-3xl items-center justify-center p-6">
          <div className="w-full rounded-xl border bg-card p-6 text-left shadow-elev">
            <div className="text-sm font-semibold">Preparing admin console…</div>
            <div className="mt-2 text-sm text-muted-foreground">Verifying secure configuration.</div>
            <div className="mt-6 h-2 w-full rounded-full bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return <Navigate to={hasAdmin ? "/login" : "/setup"} replace />;
};

export default Index;
