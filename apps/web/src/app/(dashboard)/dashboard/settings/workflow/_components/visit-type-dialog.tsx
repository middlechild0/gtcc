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
import type { Department, VisitType } from "../_hooks/use-workflow-config";
import { useWorkflowMutations } from "../_hooks/use-workflow-config";
import { mapWorkflowError } from "../_utils/error-map";
import { WorkflowStepsBuilder } from "./workflow-steps-builder";

export function VisitTypeDialog({
  trigger,
  departments,
  initial,
}: {
  trigger: React.ReactNode;
  departments: Department[];
  initial?: VisitType;
}) {
  const canManage = useHasPermission("queue:configure_workflows").allowed;
  const { createVisitType, updateVisitType } = useWorkflowMutations();
  const [open, setOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [workflowSteps, setWorkflowSteps] = useState<string[]>(
    ((initial?.workflowSteps as string[] | null) ?? []).map((s) =>
      s.trim().toUpperCase(),
    ),
  );
  const [defaultServiceInput, setDefaultServiceInput] = useState(
    initial?.defaultServiceId ? String(initial.defaultServiceId) : "",
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const isSaving = createVisitType.isPending || updateVisitType.isPending;

  const resetForm = () => {
    setName(initial?.name ?? "");
    setWorkflowSteps(
      ((initial?.workflowSteps as string[] | null) ?? []).map((s) =>
        s.trim().toUpperCase(),
      ),
    );
    setDefaultServiceInput(
      initial?.defaultServiceId ? String(initial.defaultServiceId) : "",
    );
    setIsActive(initial?.isActive ?? true);
    setInlineError(null);
  };

  const isDirty =
    name !== (initial?.name ?? "") ||
    JSON.stringify(workflowSteps) !==
      JSON.stringify(
        ((initial?.workflowSteps as string[] | null) ?? []).map((s) =>
          s.trim().toUpperCase(),
        ),
      ) ||
    defaultServiceInput !==
      (initial?.defaultServiceId ? String(initial.defaultServiceId) : "") ||
    isActive !== (initial?.isActive ?? true);

  const parseDefaultServiceId = (): {
    value: number | null;
    error?: string;
  } => {
    if (!defaultServiceInput.trim()) return { value: null };
    const n = Number(defaultServiceInput.trim());
    if (!Number.isInteger(n) || n <= 0) {
      return {
        error: "Service ID must be a positive whole number.",
        value: null,
      };
    }
    return { value: n };
  };

  const canSubmit = name.trim().length > 0 && workflowSteps.length > 0;

  const tryClose = () => {
    if (isSaving) return;
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit visit type" : "New visit type"}
          </DialogTitle>
          <DialogDescription>
            Configure ordered department workflow for this visit type.
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

          <WorkflowStepsBuilder
            value={workflowSteps}
            onChange={setWorkflowSteps}
            departments={departments}
            disabled={!canManage || isSaving}
          />

          <div className="grid gap-2">
            <Label>Default Service ID (optional)</Label>
            <Input
              value={defaultServiceInput}
              onChange={(e) => setDefaultServiceInput(e.target.value)}
              disabled={!canManage || isSaving}
              placeholder="e.g. 12"
            />
            <p className="text-xs text-muted-foreground">
              Service ID must exist in catalog.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Active</div>
              <div className="text-sm text-muted-foreground">
                Inactive visit types cannot be selected when starting visits.
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={!canManage || isSaving}
            />
          </div>

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
            disabled={!canManage || !canSubmit}
            onClick={async () => {
              setInlineError(null);
              const normalizedSteps = Array.from(
                new Set(
                  workflowSteps
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean),
                ),
              );

              if (normalizedSteps.length === 0) {
                setInlineError("At least one workflow step is required.");
                return;
              }

              const defaultServiceId = parseDefaultServiceId();
              if (defaultServiceId.error) {
                setInlineError(defaultServiceId.error);
                return;
              }

              try {
                if (initial) {
                  await updateVisitType.mutateAsync({
                    id: initial.id,
                    name: name.trim(),
                    workflowSteps: normalizedSteps,
                    defaultServiceId: defaultServiceId.value,
                    isActive,
                  });
                } else {
                  await createVisitType.mutateAsync({
                    name: name.trim(),
                    workflowSteps: normalizedSteps,
                    defaultServiceId: defaultServiceId.value,
                    isActive,
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
