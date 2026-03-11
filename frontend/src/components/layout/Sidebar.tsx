"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store";
import { getMenuItems } from "@/lib/permissions";
import {
  LayoutDashboard, Map, Users, Car, Navigation, CreditCard,
  Headphones, BarChart3, AlertTriangle, Tag, Settings, Shield, ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, any> = {
  LayoutDashboard, Map, Users, Car, Navigation, CreditCard,
  Headphones, BarChart3, AlertTriangle, Tag, Settings, Shield,
};

export default function Sidebar() {
  const pathname = usePathname();
  const admin = useAppSelector((s) => s.auth.admin);
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = admin ? getMenuItems(admin.role) : [];

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{ backgroundColor: "hsl(var(--sidebar))", color: "hsl(var(--sidebar-foreground))" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
              AR
            </div>
            <span className="font-bold text-lg">AutoRiksha</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-white/10 rounded">
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {!collapsed && admin && (
        <div className="p-4 border-t border-white/10">
          <p className="text-sm font-medium truncate">{admin.name}</p>
          <p className="text-xs text-white/50 capitalize">{admin.role.replace("_", " ")}</p>
        </div>
      )}
    </aside>
  );
}
