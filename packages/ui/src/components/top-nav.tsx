"use client";

import { ChevronDown, Search } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { SidebarTrigger } from "./sidebar";
import { cn } from "../utils";

export interface TopNavUser {
  name: string;
  email?: string;
  avatar?: string;
}

export interface TopNavProps
  extends Omit<React.ComponentProps<"header">, "title"> {
  /** Page title or breadcrumb shown in the center/left area */
  title?: React.ReactNode;
  /** Placeholder for the search input; omit to hide search */
  searchPlaceholder?: string;
  /** User info for avatar and dropdown; omit to hide user menu */
  user?: TopNavUser;
  /** Optional slot for right-side actions (e.g. buttons) */
  actions?: React.ReactNode;
  /** Optional left slot (e.g. custom trigger instead of SidebarTrigger) */
  left?: React.ReactNode;
  /** Class name for the header */
  className?: string;
}

const TopNav = React.forwardRef<HTMLElement, TopNavProps>(
  (
    {
      title,
      searchPlaceholder,
      user,
      actions,
      left,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <header
        ref={ref}
        className={cn(
          "flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 transition-[width,height] ease-linear",
          className,
        )}
        {...props}
      >
        <div className="flex flex-1 items-center gap-3">
          {left ?? <SidebarTrigger />}
          {title != null && (
            <div className="min-w-0 text-lg font-semibold tracking-tight text-foreground">
              {title}
            </div>
          )}
          {searchPlaceholder != null && (
            <div className="hidden max-w-md flex-1 md:block">
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  type="search"
                  placeholder={searchPlaceholder}
                  className="h-9 w-full bg-muted/50 pl-8"
                  readOnly
                  aria-label="Search"
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {user != null && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative flex items-center gap-2 rounded-full p-1.5 pe-2"
                  aria-label="Open user menu"
                >
                  <Avatar className="size-8 rounded-full">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-full text-xs">
                      {user.name
                        .split(/\s+/)
                        .map((s) => s[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[8rem] truncate text-sm font-medium md:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="size-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    {user.email != null && (
                      <p className="text-muted-foreground text-xs">{user.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>Account</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {children}
      </header>
    );
  },
);
TopNav.displayName = "TopNav";

export { TopNav };
