import * as React from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { NotificationsButton } from "@/components/app/NotificationsButton";
import { DateTimeDisplay } from "@/components/app/DateTimeDisplay";
import { UserMenu } from "@/components/app/UserMenu";

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
      <div className="flex min-h-svh w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 bg-transparent">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/70 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/50">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="ml-1" />
            </div>

            <div className="flex items-center gap-2">
              <DateTimeDisplay />
              <NotificationsButton />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          
          <div className="flex w-full">
            <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
