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
      <SidebarContent className="flex h-full flex-col">
        <div className="px-3 pt-3">
          <div className="rounded-2xl border bg-card p-3 shadow-soft">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-card shadow-soft">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="rounded-full px-3 py-2 transition-all hover:shadow-soft bg-[hsl(var(--pill))] text-[hsl(var(--pill-foreground))]"
                      activeClassName="shadow-soft bg-[hsl(var(--pill-active))] text-[hsl(var(--pill-active-foreground))]"
                    >
                      <item.icon className="opacity-80" />
                      {!collapsed && <span>{item.title}</span>}
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
