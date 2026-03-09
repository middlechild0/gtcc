import { LayoutDashboard, User, Users, ListOrdered } from "lucide-react";
import type { ComponentType } from "react";
import type { PermissionKey } from "@/auth/permissions";

export type RouteGroup = "main" | "settings";

/**
 * Single source of truth for a route: path, labels, permissions, and where it appears (sidebar, search, breadcrumb).
 * Use path for static routes; use "[id]" in path for dynamic segments. For 100+ routes, split into domain files
 * (e.g. branchRoutes, userAdminRoutes) and concatenate here.
 */
export type RouteConfig = {
  id: string;
  /** Path pattern: e.g. "/dashboard/settings/branches", "/dashboard/settings/branches/new", "/dashboard/settings/branches/[id]" */
  path: string;
  label: string;
  /** Shown in breadcrumb; defaults to label */
  breadcrumbLabel?: string;
  /** Parent route id for breadcrumb chain */
  parentId?: string;
  group: RouteGroup;
  permissions?: PermissionKey | PermissionKey[];
  /** Show in sidebar (only applies when group === "main") */
  showInSidebar?: boolean;
  /** Include in top-nav settings search */
  showInSearch?: boolean;
  icon?: ComponentType<{ className?: string }>;
};

/** All routes in a flat list. Add new routes here */
export const routes: RouteConfig[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    group: "main",
    showInSidebar: true,
    showInSearch: true,
    icon: LayoutDashboard,
  },
  {
    id: "patients-list",
    path: "/dashboard/patients",
    label: "Patients",
    group: "main",
    showInSidebar: true,
    showInSearch: true,
    permissions: "patients:view",
    icon: Users,
  },
  {
    id: "patients-new",
    path: "/dashboard/patients/new",
    label: "New patient",
    breadcrumbLabel: "New patient",
    group: "main",
    parentId: "patients-list",
    permissions: "patients:create",
    showInSearch: true,
  },

  {
    id: "queue-overview",
    path: "/dashboard/queue",
    label: "Live Queue",
    group: "main",
    showInSidebar: true,
    showInSearch: true,
    permissions: "queue:view",
    icon: ListOrdered,
  },
  {
    id: "queue-department",
    path: "/dashboard/queue/[id]",
    label: "Department Queue",
    breadcrumbLabel: "Department Queue",
    group: "main",
    parentId: "queue-overview",
    permissions: "queue:view",
    showInSearch: false,
    showInSidebar: false,
  },

  {
    id: "branches-list",
    path: "/dashboard/settings/branches",
    label: "Branches",
    breadcrumbLabel: "Branches",
    group: "settings",
    parentId: "settings-root",
    permissions: "branches:view",
    showInSearch: true,
  },
  {
    id: "branches-new",
    path: "/dashboard/settings/branches/new",
    label: "New branch",
    breadcrumbLabel: "New branch",
    group: "settings",
    parentId: "branches-list",
    permissions: "branches:manage",
    showInSearch: true,
  },
  {
    id: "branches-detail",
    path: "/dashboard/settings/branches/[id]",
    label: "Branch",
    breadcrumbLabel: "Branch",
    group: "settings",
    parentId: "branches-list",
    permissions: "branches:view",
    showInSearch: false,
  },
  {
    id: "user-admin-list",
    path: "/dashboard/settings/user-administration",
    label: "User Administration",
    breadcrumbLabel: "User Administration",
    group: "settings",
    parentId: "settings-root",
    permissions: "auth:manage_staff",
    showInSearch: true,
    icon: Users,
  },
  {
    id: "user-admin-invite",
    path: "/dashboard/settings/user-administration/invite",
    label: "Invite user",
    breadcrumbLabel: "Invite user",
    group: "settings",
    parentId: "user-admin-list",
    permissions: "auth:manage_staff",
    showInSearch: true,
  },
  {
    id: "user-admin-detail",
    path: "/dashboard/settings/user-administration/[id]",
    label: "User",
    breadcrumbLabel: "User",
    group: "settings",
    parentId: "user-admin-list",
    permissions: "auth:manage_staff",
    showInSearch: false,
  },
  {
    id: "account-settings",
    path: "/dashboard/settings/account",
    label: "My Account",
    breadcrumbLabel: "My Account",
    group: "settings",
    parentId: "settings-root",
    showInSearch: true,
    icon: User,
  },
  {
    id: "insurance-providers-list",
    path: "/dashboard/settings/insurance-providers",
    label: "Insurance Providers",
    breadcrumbLabel: "Insurance Providers",
    group: "settings",
    parentId: "settings-root",
    permissions: "billing:manage_insurance_providers",
    showInSearch: true,
  },
];

const routesById = new Map(routes.map((r) => [r.id, r]));

/** Turn a path pattern like "/dashboard/settings/branches/[id]" into a RegExp that matches pathnames */
function pathToRegex(path: string): RegExp {
  const pattern = path
    .replace(/\[\.\.\.\w+\]/g, ".+")
    .replace(/\[\w+\]/g, "[^/]+");
  return new RegExp(`^${pattern}$`);
}

/** Find the route that matches the given pathname (exact first, then dynamic [id] patterns). */
export function getRouteByPathname(pathname: string): RouteConfig | null {
  const normalized = pathname.replace(/\?.*$/, "").replace(/\/$/, "") || "/";
  const exact = routes.find((r) => r.path === normalized);
  if (exact) return exact;
  const dynamic = routes.filter((r) => r.path.includes("[id]"));
  for (const r of dynamic) {
    if (pathToRegex(r.path).test(normalized)) return r;
  }
  return null;
}

export type BreadcrumbItem = { label: string; href?: string };

/** Build breadcrumb items for the current pathname (root to current). */
export function getBreadcrumb(pathname: string): BreadcrumbItem[] {
  const route = getRouteByPathname(pathname);
  if (!route) return [];

  const ancestors: RouteConfig[] = [];
  let current: RouteConfig | undefined = route;
  while (current) {
    ancestors.unshift(current);
    current = current.parentId
      ? (routesById.get(current.parentId) as RouteConfig | undefined)
      : undefined;
  }

  const normalized = pathname.replace(/\?.*$/, "").replace(/\/$/, "") || "/";
  return ancestors.map((r, i) => {
    const isLast = i === ancestors.length - 1;
    const label = r.breadcrumbLabel ?? r.label;
    const isDynamic = r.path.includes("[id]");
    const href =
      isDynamic && isLast ? normalized : isDynamic ? undefined : r.path;
    return { label, href };
  });
}

/** Routes that should appear in the sidebar (main group, showInSidebar). */
export const sidebarRoutes: RouteConfig[] = routes.filter(
  (r) => r.group === "main" && r.showInSidebar !== false,
);

/** Routes that are searchable in the top nav (showInSearch; caller must filter by permission). */
export const searchableRoutes: RouteConfig[] = routes.filter(
  (r) => r.showInSearch !== false,
);

/** Href for a route (path for static; pass pathname for dynamic current page). */
export function getRouteHref(
  route: RouteConfig,
  currentPathname?: string,
): string {
  if (route.path.includes("[id]") && currentPathname)
    return currentPathname.replace(/\?.*$/, "").replace(/\/$/, "") || "/";
  return route.path;
}
