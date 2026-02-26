"use client";

import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@visyx/ui/table";
import { UserPlus } from "lucide-react";
import Link from "next/link";

const PLACEHOLDER_USERS = [
  {
    id: "1",
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    role: "Admin",
    status: "Active",
    lastActive: "2 hours ago",
  },
  {
    id: "2",
    name: "Jordan Lee",
    email: "jordan.lee@example.com",
    role: "Member",
    status: "Active",
    lastActive: "1 day ago",
  },
  {
    id: "3",
    name: "Sam Taylor",
    email: "sam.taylor@example.com",
    role: "Member",
    status: "Pending",
    lastActive: "—",
  },
  {
    id: "4",
    name: "Casey Kim",
    email: "casey.kim@example.com",
    role: "Manager",
    status: "Active",
    lastActive: "5 hours ago",
  },
  {
    id: "5",
    name: "Riley Jones",
    email: "riley.jones@example.com",
    role: "Member",
    status: "Inactive",
    lastActive: "2 weeks ago",
  },
];

export default function UserAdministrationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          User Administration
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="#">
              <UserPlus className="mr-2 size-4" />
              Invite new user
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="#">Refresh</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="#">Export</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          type="search"
          placeholder="Search by name or email"
          className="h-9 w-full max-w-xs"
          aria-label="Search users"
        />
        <Select>
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Clear filters
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLACEHOLDER_USERS.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.lastActive}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/dashboard/user-administration/${u.id}`}
                      >
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
