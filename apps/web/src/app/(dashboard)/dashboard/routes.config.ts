import type { ComponentType } from "react";
import { LayoutDashboard, Settings, Users } from "lucide-react";
import type { PermissionKey } from "@/auth/permissions";

export type RouteGroup = "main" | "settings";

export type NavItemConfig = {
  id: string;
  label: string;
  href: string;
  group: RouteGroup;
  icon?: ComponentType<{ className?: string }>;
  requiredPermissions?: PermissionKey | PermissionKey[];
};

export type SettingsCardConfig = {
  id: string;
  title: string;
  description: string;
  href: string;
  requiredPermissions?: PermissionKey | PermissionKey[];
};

export const navItems: NavItemConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    group: "main",
    icon: LayoutDashboard,
  },
  {
    id: "branches",
    label: "Branches",
    href: "/dashboard/settings/branches",
    group: "settings",
    requiredPermissions: "branches:view",
  },
  {
    id: "user-administration",
    label: "User Administration",
    href: "/dashboard/settings/user-administration",
    group: "settings",
    icon: Users,
    requiredPermissions: "auth:manage_staff",
  },
];


