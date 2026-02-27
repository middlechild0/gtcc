"use client";

import { Avatar, AvatarFallback } from "@visyx/ui/avatar";
import { Button } from "@visyx/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { StaffDetail } from "../_utils/staff-types";
import { StaffStatusBadge } from "./staff-status-badge";

type StaffDetailHeaderProps = {
  staff: StaffDetail;
};

export function StaffDetailHeader({ staff }: StaffDetailHeaderProps) {
  const displayName = [staff.firstName, staff.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className="flex flex-col gap-2">
      <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
        <Link href="/dashboard/settings/user-administration">
          <ArrowLeft className="mr-2 size-4" />
          Back to users
        </Link>
      </Button>
      <div className="flex items-center gap-4">
        <Avatar className="size-14 rounded-lg">
          <AvatarFallback className="rounded-lg text-lg">
            {(displayName || staff.email || "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {displayName || "—"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
            <span>{staff.email}</span>
            <StaffStatusBadge isActive={Boolean(staff.isActive)} />
            <span>User ID: {staff.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
