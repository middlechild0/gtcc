"use client";

import { Button } from "@visyx/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@visyx/ui/dialog";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import { SubmitButton } from "@visyx/ui/submit-button";
import { Switch } from "@visyx/ui/switch";
import { useState } from "react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import type { Department } from "../_hooks/use-workflow-config";
import { useWorkflowMutations } from "../_hooks/use-workflow-config";
import { mapWorkflowError } from "../_utils/error-map";

export function DepartmentDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: Department;
}) {
  const canManage = useHasPermission("queue:configure_workflows").allowed;
  const { createDepartment, updateDepartment } = useWorkflowMutations();
  const [open, setOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const isSaving = createDepartment.isPending || updateDepartment.isPending;

  const resetForm = () => {
    setName(initial?.name ?? "");
    setCode(initial?.code ?? "");
    setIsActive(initial?.isActive ?? true);
    setInlineError(null);
  };

  const dirty =
    name !== (initial?.name ?? "") ||
    code !== (initial?.code ?? "") ||
    isActive !== (initial?.isActive ?? true);

  const tryClose = () => {
    if (isSaving) return;
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!canManage) return;
        if (v) resetForm();
        if (!v) {
          tryClose();
          return;
        }
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit department" : "New department"}
          </DialogTitle>
          <DialogDescription>
            Department code is immutable after creation and is used in workflow
            routing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage || isSaving}
            />
          </div>

          <div className="grid gap-2">
            <Label>Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={!canManage || isSaving || Boolean(initial)}
              placeholder="TRIAGE"
            />
            <p className="text-xs text-muted-foreground">
              Letters, numbers, and underscores only.
            </p>
          </div>

          {initial && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">Active</div>
                <div className="text-sm text-muted-foreground">
                  Inactive departments cannot be used for new workflow edits.
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={!canManage || isSaving}
              />
            </div>
          )}

          {inlineError && (
            <p className="text-sm text-destructive">{inlineError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={tryClose} disabled={isSaving}>
            Cancel
          </Button>
          <SubmitButton
            isSubmitting={isSaving}
            disabled={!canManage || !name.trim() || !code.trim()}
            onClick={async () => {
              setInlineError(null);
              try {
                if (initial) {
                  await updateDepartment.mutateAsync({
                    id: initial.id,
                    name: name.trim(),
                    isActive,
                  });
                } else {
                  await createDepartment.mutateAsync({
                    name: name.trim(),
                    code: code.trim().toUpperCase(),
                  });
                }
                setOpen(false);
              } catch (error) {
                setInlineError(mapWorkflowError(error));
              }
            }}
          >
            Save
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
