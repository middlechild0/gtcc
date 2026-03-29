"use client";

import { Button } from "@visyx/ui/button";
import { Label } from "@visyx/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { Department } from "../_hooks/use-workflow-config";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  departments: Department[];
  disabled?: boolean;
};

export function WorkflowStepsBuilder({
  value,
  onChange,
  departments,
  disabled,
}: Props) {
  const activeDepartments = departments.filter((d) => d.isActive);
  const uniqueCodes = value.map((s) => s.trim().toUpperCase()).filter(Boolean);
  const used = new Set(uniqueCodes.map((c) => c.toUpperCase()));
  const availableToAdd = activeDepartments.filter(
    (d) => !used.has(d.code.toUpperCase()),
  );

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= uniqueCodes.length) return;
    const next = [...uniqueCodes];
    const tmp = next[idx];
    next[idx] = next[target]!;
    next[target] = tmp!;
    onChange(next);
  };

  const remove = (idx: number) => {
    const next = uniqueCodes.filter((_, i) => i !== idx);
    onChange(next);
  };

  const updateStep = (idx: number, nextCode: string) => {
    const next = [...uniqueCodes];
    next[idx] = nextCode.trim().toUpperCase();
    const deduped: string[] = [];
    for (const code of next) {
      if (!deduped.includes(code)) deduped.push(code);
    }
    onChange(deduped);
  };

  const addStep = () => {
    const first = availableToAdd[0];
    if (!first) return;
    onChange([...uniqueCodes, first.code]);
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>Workflow Steps</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStep}
          disabled={disabled || availableToAdd.length === 0}
        >
          Add Step
        </Button>
      </div>

      {uniqueCodes.length === 0 ? (
        <p className="text-sm text-destructive">
          Add at least one workflow step.
        </p>
      ) : (
        <div className="space-y-2 rounded-md border p-3">
          {uniqueCodes.map((code, idx) => (
            <div key={`${code}-${idx}`} className="flex items-center gap-2">
              <span className="w-5 text-xs text-muted-foreground">
                {idx + 1}
              </span>
              <Select
                value={code}
                onValueChange={(v) => updateStep(idx, v)}
                disabled={disabled}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeDepartments.map((d) => (
                    <SelectItem key={d.id} value={d.code}>
                      {d.code} - {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => move(idx, -1)}
                disabled={disabled || idx === 0}
                aria-label="Move up"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => move(idx, 1)}
                disabled={disabled || idx === uniqueCodes.length - 1}
                aria-label="Move down"
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(idx)}
                disabled={disabled}
                aria-label="Remove step"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
