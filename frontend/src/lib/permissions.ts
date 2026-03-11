import type { AdminRole } from "./types";

type Permission =
  | "view_dashboard"
  | "view_rides"
  | "view_errors"
  | "manage_admins"
  | "approve_drivers"
  | "ban_users"
  | "view_payments"
  | "process_payouts"
  | "issue_refunds"
  | "manage_promotions"
  | "update_fare"
  | "manage_tickets"
  | "view_activity_logs";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    "view_dashboard", "view_rides", "view_errors", "manage_admins",
    "approve_drivers", "ban_users", "view_payments", "process_payouts",
    "issue_refunds", "manage_promotions", "update_fare", "manage_tickets",
    "view_activity_logs",
  ],
  DEVELOPER: ["view_dashboard", "view_rides", "view_errors", "view_activity_logs"],
  OPERATIONS: [
    "view_dashboard", "view_rides", "approve_drivers", "ban_users",
    "view_payments", "manage_promotions", "manage_tickets", "view_activity_logs",
  ],
  FINANCE: [
    "view_dashboard", "view_rides", "view_payments", "process_payouts",
    "issue_refunds", "manage_promotions", "update_fare",
  ],
  CUSTOMER_SERVICE: ["view_dashboard", "view_rides", "ban_users", "manage_tickets"],
  SUPPORT_AGENT: ["view_rides", "manage_tickets"],
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getMenuItems(role: AdminRole) {
  const items = [
    { label: "Dashboard", href: "/", icon: "LayoutDashboard", permission: "view_dashboard" as Permission },
    { label: "Live Map", href: "/live", icon: "Map", permission: "view_dashboard" as Permission },
    { label: "Users", href: "/users", icon: "Users", permission: "view_dashboard" as Permission },
    { label: "Drivers", href: "/drivers", icon: "Car", permission: "view_dashboard" as Permission },
    { label: "Rides", href: "/rides", icon: "Navigation", permission: "view_rides" as Permission },
    { label: "Payments", href: "/payments", icon: "CreditCard", permission: "view_payments" as Permission },
    { label: "Support", href: "/support", icon: "MessageCircle", permission: "manage_tickets" as Permission },
    { label: "Analytics", href: "/analytics", icon: "BarChart3", permission: "view_dashboard" as Permission },
    { label: "Errors", href: "/errors", icon: "AlertTriangle", permission: "view_errors" as Permission },
    { label: "Promotions", href: "/promotions", icon: "Tag", permission: "manage_promotions" as Permission },
    { label: "Settings", href: "/settings", icon: "Settings", permission: "view_dashboard" as Permission },
    { label: "Activity Log", href: "/activity", icon: "FileText", permission: "view_activity_logs" as Permission },
  ];

  return items.filter((item) => hasPermission(role, item.permission));
}
