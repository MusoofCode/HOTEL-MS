import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LogOut, User2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/useAuth";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

export function UserMenu({ className }: { className?: string }) {
  const { session } = useAuth();

  const profile = useQuery({
    enabled: Boolean(session?.user?.id),
    queryKey: ["my_profile", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const role = useQuery({
    enabled: Boolean(session?.user?.id),
    queryKey: ["my_role", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw error;
      return data ? "Admin" : "User";
    },
  });

  const displayName = profile.data?.display_name || session?.user?.email || "Account";
  const initials = (displayName || "A")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 rounded-2xl gap-2 px-2.5 shadow-soft",
            "transition-transform duration-200 ease-linear active:scale-95",
            className,
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left leading-tight md:block">
            <div className="truncate text-sm font-medium">{displayName}</div>
            <div className="text-xs text-muted-foreground">{role.isLoading ? "…" : role.data}</div>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-0.5">
          <div className="flex items-center gap-2">
            <User2 className="h-4 w-4" />
            <span className="truncate">{displayName}</span>
          </div>
          <div className="text-xs text-muted-foreground">{role.isLoading ? "…" : role.data}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ConfirmDialog
          title="Log out?"
          description="You will need to sign in again to access the admin dashboard."
          confirmLabel="Log out"
          onConfirm={async () => {
            await supabase.auth.signOut();
          }}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </ConfirmDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
