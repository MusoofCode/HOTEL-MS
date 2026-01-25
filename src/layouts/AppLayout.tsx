import * as React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { NotificationsButton } from "@/components/app/NotificationsButton";

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
      <div className="min-h-svh w-full bg-background">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/70 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="ml-1" />
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-card shadow-soft">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsButton />
            <ThemeToggle />
          </div>
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
