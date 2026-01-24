import * as React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";

export function AppLayout() {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Idle timeout protection: 30 minutes of inactivity.
    const TIMEOUT_MS = 30 * 60 * 1000;
    let timer: number | undefined;

    const reset = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        await supabase.auth.signOut();
        toast("Session timed out", { description: "For security, please sign in again." });
        navigate("/login", { replace: true });
      }, TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-svh w-full bg-background bg-brand-glow">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/70 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="ml-1" />
            <div className="flex items-center gap-2">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card shadow-soft">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Hotel Admin</div>
                <div className="text-xs text-muted-foreground">Command Center</div>
              </div>
            </div>
          </div>

          <Button
            variant="subtle"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut />
            Logout
          </Button>
        </header>

        <div className="flex w-full">
          <AppSidebar />
          <SidebarInset className="bg-transparent">
            <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
