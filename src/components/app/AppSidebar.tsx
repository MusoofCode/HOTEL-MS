import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BedDouble,
  CalendarDays,
  CreditCard,
  FileText,
  Settings,
  Users,
  Warehouse,
  BadgeDollarSign,
  IdCard,
  Building2,
  LogOut,
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: BarChart3 },
  { title: "Reservations", url: "/app/reservations", icon: CalendarDays },
  { title: "Rooms", url: "/app/rooms", icon: BedDouble },
  { title: "Customers", url: "/app/customers", icon: Users },
  { title: "Billing", url: "/app/billing", icon: CreditCard },
  { title: "Expenses", url: "/app/expenses", icon: BadgeDollarSign },
  { title: "Inventory", url: "/app/inventory", icon: Warehouse },
  { title: "HR Records", url: "/app/hr", icon: IdCard },
  { title: "Reports", url: "/app/reports", icon: FileText },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className={collapsed ? "w-[--sidebar-width-icon]" : "w-[--sidebar-width]"}
    >
      <SidebarContent className="flex h-full flex-col py-4">
        {/* Brand Logo */}
        <div className="mb-8 flex items-center justify-center px-4">
          <div className={cn(
            "inline-flex items-center justify-center rounded-2xl bg-[hsl(var(--brand-warm))] shadow-soft transition-all duration-300",
            collapsed ? "h-10 w-10" : "h-12 w-12"
          )}>
            <Building2 className={cn("text-white transition-all duration-300", collapsed ? "h-5 w-5" : "h-6 w-6")} />
          </div>
        </div>

        <SidebarGroup className="px-3">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                        "bg-transparent text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]",
                        collapsed ? "justify-center" : "justify-start"
                      )}
                      activeClassName="bg-[hsl(var(--brand-warm))] text-white shadow-soft hover:bg-[hsl(var(--brand-warm))]"
                    >
                      <item.icon className={cn("transition-all duration-200", collapsed ? "h-5 w-5" : "h-5 w-5")} />
                      {!collapsed && (
                        <span className="text-sm font-medium transition-all duration-200">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout pinned to bottom */}
        <div className="mt-auto p-3">
          <ConfirmDialog
            title="Log out?"
            description="You will need to sign in again to access the admin dashboard."
            confirmLabel="Log out"
            onConfirm={async () => {
              await supabase.auth.signOut();
              navigate("/login", { replace: true });
            }}
          >
            <Button
              variant="outline"
              className={
                collapsed
                  ? "h-10 w-10 rounded-2xl p-0"
                  : "w-full justify-start rounded-2xl"
              }
            >
              <LogOut />
              {!collapsed ? <span>Logout</span> : null}
            </Button>
          </ConfirmDialog>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
