"use client";

import { Badge } from "@visyx/ui/badge";
import { Button } from "@visyx/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@visyx/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@visyx/ui/alert-dialog";
import { Skeleton } from "@visyx/ui/skeleton";
import { Edit, Plus, Trash2, Users } from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { trpc } from "@/trpc/client";
import { UserAdminHeader } from "../_components/user-admin-header";
import { PermissionGroupForm } from "../_components/permission-group-form";

type Group = {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};

function PermissionGroupsContent() {
    const utils = trpc.useUtils();
    const { hasPermission } = useAuth();
    const canManage = hasPermission("auth:manage_permission_groups");

    const { data: groups = [], isLoading } = trpc.staff.listGroups.useQuery({
        includeInactive: false,
    });

    const { data: permissionsCatalog = [] } = trpc.staff.listPermissions.useQuery(
        { includeInactive: false },
        { enabled: canManage },
    );

    const deleteGroup = trpc.staff.deleteGroup.useMutation({
        onSuccess: () => {
            toast.success("Permission group deleted.");
            void utils.staff.listGroups.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    // Form state
    const [formOpen, setFormOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editGroupDetail, setEditGroupDetail] = useState<{
        permissionIds: number[];
    } | null>(null);

    // Delete confirm state
    const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

    const handleEdit = async (group: Group) => {
        try {
            const detail = await utils.staff.getGroup.fetch({ id: group.id });
            setEditingGroup(group);
            setEditGroupDetail({ permissionIds: detail.items.map((i) => i.permissionId) });
            setFormOpen(true);
        } catch {
            toast.error("Failed to load group details.");
        }
    };

    const handleCreate = () => {
        setEditingGroup(null);
        setEditGroupDetail(null);
        setFormOpen(true);
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingGroup(null);
        setEditGroupDetail(null);
    };

    return (
        <div className="space-y-6">
            <UserAdminHeader
                title="Permission Groups"
                description="Create and manage reusable permission templates. Apply groups to staff from their Permissions tab."
                actions={
                    canManage ? (
                        <Button onClick={handleCreate} id="create-permission-group-btn">
                            <Plus className="mr-2 size-4" />
                            New group
                        </Button>
                    ) : null
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Groups</CardTitle>
                    <CardDescription>
                        Each group is a reusable set of permissions. Assigning a group to a
                        staff member copies its permissions at that moment — future edits to
                        the group don't automatically propagate.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="divide-y">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4">
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-56" />
                                    </div>
                                    <Skeleton className="h-8 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center">
                            <Users className="text-muted-foreground size-10" />
                            <p className="text-muted-foreground text-sm">
                                No permission groups yet.
                            </p>
                            {canManage && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCreate}
                                    className="mt-2"
                                >
                                    <Plus className="mr-2 size-4" />
                                    Create your first group
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {groups.map((group) => (
                                <div
                                    key={group.id}
                                    className="flex items-start justify-between gap-4 p-4"
                                >
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{group.name}</span>
                                            {!group.isActive && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        {group.description && (
                                            <p className="text-muted-foreground text-sm">
                                                {group.description}
                                            </p>
                                        )}
                                    </div>
                                    {canManage && (
                                        <div className="flex shrink-0 items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => void handleEdit(group)}
                                                id={`edit-group-${group.id}`}
                                            >
                                                <Edit className="mr-1.5 size-3.5" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => setDeletingGroup(group)}
                                                id={`delete-group-${group.id}`}
                                            >
                                                <Trash2 className="mr-1.5 size-3.5" />
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit dialog */}
            <PermissionGroupForm
                open={formOpen}
                onClose={handleFormClose}
                groupId={editingGroup?.id}
                initialName={editingGroup?.name ?? ""}
                initialDescription={editingGroup?.description ?? ""}
                initialPermissionIds={editGroupDetail?.permissionIds ?? []}
                permissionsCatalog={permissionsCatalog}
            />

            {/* Delete confirm dialog */}
            <AlertDialog
                open={deletingGroup !== null}
                onOpenChange={(o) => !o && setDeletingGroup(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deletingGroup?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the group template permanently. Staff members who
                            were assigned permissions from this group keep those permissions —
                            they just lose the group label on their permission rows.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deletingGroup) {
                                    deleteGroup.mutate({ id: deletingGroup.id });
                                    setDeletingGroup(null);
                                }
                            }}
                        >
                            Delete group
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default function PermissionGroupsPage() {
    return (
        <RouteGuard required="auth:manage_permission_groups">
            <Suspense
                fallback={
                    <div className="space-y-4">
                        <div className="h-7 w-44 rounded-md bg-muted" />
                        <div className="h-48 rounded-md bg-muted" />
                    </div>
                }
            >
                <PermissionGroupsContent />
            </Suspense>
        </RouteGuard>
    );
}
