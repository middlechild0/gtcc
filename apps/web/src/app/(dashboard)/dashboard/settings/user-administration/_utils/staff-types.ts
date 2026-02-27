"use client";

import type { RouterOutputs } from "@/trpc/client";

export type StaffListItem = RouterOutputs["staff"]["list"][number];
export type StaffDetail = RouterOutputs["staff"]["get"];
export type PermissionRow = RouterOutputs["staff"]["listPermissions"][number];
export type PermissionGroupListItem =
  RouterOutputs["staff"]["listGroups"][number];
