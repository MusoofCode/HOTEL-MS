import { useLocation } from "react-router-dom";
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
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
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

  const currentPath = location.pathname;

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className={collapsed ? "w-[--sidebar-width-icon]" : "w-[--sidebar-width]"}
    >
      <SidebarContent>
        <div className="px-3 pt-3">
          <div className="rounded-lg border bg-card p-3 shadow-soft">
            <div className="text-xs font-medium text-muted-foreground">Hotel Management</div>
            <div className="mt-1 text-sm font-semibold">Admin Console</div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="rounded-md"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
