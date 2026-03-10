"use client";

import { Badge } from "@visyx/ui/badge";
import { Button } from "@visyx/ui/button";
import { Checkbox } from "@visyx/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@visyx/ui/dialog";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import { ScrollArea } from "@visyx/ui/scroll-area";
import { Textarea } from "@visyx/ui/textarea";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";

type PermissionRow = {
    id: number;
    key: string;
    module: string;
    label: string;
    description: string | null;
};

type PermissionGroupFormProps = {
    open: boolean;
    onClose: () => void;
    /** If provided, we're editing an existing group. Otherwise creating. */
    groupId?: number;
    initialName?: string;
    initialDescription?: string;
    initialPermissionIds?: number[];
    permissionsCatalog: PermissionRow[];
};

export function PermissionGroupForm({
    open,
    onClose,
    groupId,
    initialName = "",
    initialDescription = "",
    initialPermissionIds = [],
    permissionsCatalog,
}: PermissionGroupFormProps) {
    const utils = trpc.useUtils();
    const isEdit = groupId !== undefined;

    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
        new Set(initialPermissionIds),
    );
    const [permSearch, setPermSearch] = useState("");

    // Re-initialise when the form opens for a different group
    useEffect(() => {
        if (open) {
            setName(initialName);
            setDescription(initialDescription);
            setSelectedIds(new Set(initialPermissionIds));
            setPermSearch("");
        }
    }, [open, initialName, initialDescription, initialPermissionIds]);

    const createGroup = trpc.staff.createGroup.useMutation({
        onSuccess: () => {
            toast.success("Permission group created.");
            void utils.staff.listGroups.invalidate();
            onClose();
        },
        onError: (err) => toast.error(err.message),
    });

    const updateGroup = trpc.staff.updateGroup.useMutation({
        onSuccess: () => {
            toast.success("Permission group updated.");
            void utils.staff.listGroups.invalidate();
            onClose();
        },
        onError: (err) => toast.error(err.message),
    });

    const isPending = createGroup.isPending || updateGroup.isPending;

    const permissionsByModule = useMemo(() => {
        let rows = permissionsCatalog;
        if (permSearch.trim()) {
            const q = permSearch.toLowerCase();
            rows = rows.filter(
                (p) =>
                    p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q),
            );
        }
        const grouped = new Map<string, PermissionRow[]>();
        for (const p of rows) {
            grouped.set(p.module, [...(grouped.get(p.module) ?? []), p]);
        }
        return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }, [permissionsCatalog, permSearch]);

    const togglePerm = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleModule = (perms: PermissionRow[]) => {
        const allSelected = perms.every((p) => selectedIds.has(p.id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const p of perms) {
                if (allSelected) next.delete(p.id);
                else next.add(p.id);
            }
            return next;
        });
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            toast.error("Group name is required.");
            return;
        }
        const permissionIds = [...selectedIds];
        if (isEdit && groupId !== undefined) {
            updateGroup.mutate({ id: groupId, name: name.trim(), description: description.trim() || undefined, permissionIds });
        } else {
            createGroup.mutate({ name: name.trim(), description: description.trim() || undefined, permissionIds });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle>
                        {isEdit ? "Edit permission group" : "Create permission group"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update this group's name, description, or permissions. Changes only affect future applications — existing staff keep their current grants."
                            : "Define a reusable set of permissions that can be applied to staff members."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
                    {/* Name */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="group-name">Name</Label>
                        <Input
                            id="group-name"
                            placeholder="e.g. Senior Cashier"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    {/* Description */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="group-desc">Description</Label>
                        <Textarea
                            id="group-desc"
                            placeholder="Brief description of this role's responsibilities"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isPending}
                            className="resize-none"
                        />
                    </div>

                    {/* Permissions picker */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label>Permissions</Label>
                            <Badge variant="secondary" className="text-xs">
                                {selectedIds.size} selected
                            </Badge>
                        </div>
                        <div className="relative">
                            <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                            <Input
                                placeholder="Search permissions..."
                                className="h-8 pl-8 text-sm"
                                value={permSearch}
                                onChange={(e) => setPermSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-56 rounded-md border">
                            <div className="divide-y">
                                {permissionsByModule.map(([module, perms]) => {
                                    const allSelected = perms.every((p) => selectedIds.has(p.id));
                                    const someSelected = perms.some((p) => selectedIds.has(p.id));
                                    return (
                                        <div key={module}>
                                            <button
                                                type="button"
                                                className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-1.5 text-left"
                                                onClick={() => toggleModule(perms)}
                                            >
                                                <Checkbox
                                                    checked={allSelected}
                                                    data-state={
                                                        someSelected && !allSelected
                                                            ? "indeterminate"
                                                            : allSelected
                                                                ? "checked"
                                                                : "unchecked"
                                                    }
                                                    className="pointer-events-none"
                                                    aria-hidden
                                                />
                                                <span className="text-xs font-semibold capitalize tracking-wide">
                                                    {module}
                                                </span>
                                            </button>
                                            {perms.map((perm) => (
                                                <button
                                                    key={perm.id}
                                                    type="button"
                                                    className="hover:bg-muted/40 flex w-full items-center gap-2 py-1.5 pl-8 pr-3 text-left"
                                                    onClick={() => togglePerm(perm.id)}
                                                >
                                                    <Checkbox
                                                        checked={selectedIds.has(perm.id)}
                                                        className="pointer-events-none"
                                                        aria-hidden
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="text-sm">{perm.label}</div>
                                                        {perm.description && (
                                                            <div className="text-muted-foreground truncate text-xs">
                                                                {perm.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending
                            ? isEdit
                                ? "Saving..."
                                : "Creating..."
                            : isEdit
                                ? "Save changes"
                                : "Create group"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
