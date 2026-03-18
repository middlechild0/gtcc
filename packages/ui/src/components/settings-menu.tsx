"use client";

import { ArrowLeft, ChevronDown, Search, Settings } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { cn } from "../utils";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";

export interface SettingsMenuItem {
  label: string;
  href: string;
}

export interface SettingsMenuProps {
  /** List of menu items (label + href); defaults to built-in list including User Administration */
  items?: SettingsMenuItem[];
  /** Placeholder for the search input in the dropdown header */
  searchPlaceholder?: string;
  /** Optional class name for the trigger button */
  triggerClassName?: string;
  /** Optional align for the popover (e.g. "end" to align right) */
  align?: "start" | "center" | "end";
}

const DEFAULT_ITEMS: SettingsMenuItem[] = [
  { label: "Advanced Configuration", href: "#" },
  { label: "Booking and Classes", href: "#" },
  { label: "Club Details", href: "#" },
  { label: "Custom Fields", href: "#" },
  { label: "Doors and Readers", href: "#" },
  { label: "Financial Configuration", href: "#" },
  { label: "Forms and Waivers", href: "#" },
  { label: "Integrations", href: "#" },
  { label: "Measurement Configuration", href: "#" },
  { label: "Member Portal", href: "#" },
  { label: "Membership Types", href: "#" },
  { label: "Products", href: "#" },
  { label: "Roster and Open Hours", href: "#" },
  { label: "Task Automation", href: "#" },
  { label: "Templates", href: "#" },
  {
    label: "User Administration",
    href: "/dashboard/settings/user-administration",
  },
  { label: "Workout Configuration", href: "#" },
];

export function SettingsMenu({
  items = DEFAULT_ITEMS,
  searchPlaceholder = "Search Settings",
  triggerClassName,
  align = "end",
}: SettingsMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex h-9 shrink-0 items-center gap-1 rounded-full px-2",
            triggerClassName,
          )}
          aria-label="Open settings menu"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent/80">
            <Settings className="size-4" />
          </span>
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        className="border-sidebar-border bg-sidebar text-sidebar-foreground w-80 p-0 shadow-lg"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-sidebar-border p-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 border-sidebar-border bg-sidebar-accent/50 pl-8 text-sidebar-foreground placeholder:text-sidebar-foreground/60"
                aria-label={searchPlaceholder}
              />
            </div>
          </div>
          <ScrollArea className="h-[min(60vh,20rem)]">
            <nav className="p-2" aria-label="Settings">
              <ul className="flex flex-col gap-0.5">
                {filteredItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground block rounded-md px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
