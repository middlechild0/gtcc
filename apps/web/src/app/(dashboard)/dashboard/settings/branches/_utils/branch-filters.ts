"use client";

import type { Branch } from "./branch-types";

export function filterBranches(branches: Branch[], rawSearch: string): Branch[] {
  const term = rawSearch.trim().toLowerCase();
  if (!term) return branches;

  return branches.filter((b) => {
    const name = b.name?.toLowerCase() ?? "";
    const email = b.email?.toLowerCase() ?? "";
    const phone = b.phone?.toLowerCase() ?? "";
    const address = b.address?.toLowerCase() ?? "";
    return (
      name.includes(term) ||
      email.includes(term) ||
      phone.includes(term) ||
      address.includes(term)
    );
  });
}

