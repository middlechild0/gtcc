"use client";

import { useToast } from "@visyx/ui/use-toast";
import { type RouterOutputs, trpc } from "@/trpc/client";
import { mapWorkflowError } from "../_utils/error-map";

export type Department = RouterOutputs["workflow"]["listDepartments"][number];
export type VisitType = RouterOutputs["workflow"]["listVisitTypes"][number];

export function useWorkflowData(enabled = true) {
  const departments = trpc.workflow.listDepartments.useQuery(undefined, {
    staleTime: 0,
    enabled,
  });

  const visitTypes = trpc.workflow.listVisitTypes.useQuery(undefined, {
    staleTime: 0,
    enabled,
  });

  return { departments, visitTypes };
}

export function useWorkflowMutations() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const invalidateCore = async () => {
    await Promise.all([
      utils.workflow.listDepartments.invalidate(),
      utils.workflow.listVisitTypes.invalidate(),
    ]);
  };

  const createDepartment = trpc.workflow.createDepartment.useMutation({
    onSuccess: async () => {
      await invalidateCore();
      toast({ title: "Department created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create department",
        description: mapWorkflowError(error),
        variant: "destructive",
      });
    },
  });

  const updateDepartment = trpc.workflow.updateDepartment.useMutation({
    onSuccess: async () => {
      await invalidateCore();
      toast({ title: "Department updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update department",
        description: mapWorkflowError(error),
        variant: "destructive",
      });
    },
  });

  const createVisitType = trpc.workflow.createVisitType.useMutation({
    onSuccess: async () => {
      await Promise.all([
        invalidateCore(),
        utils.queue.getVisitTypes.invalidate(),
      ]);
      toast({ title: "Visit type created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create visit type",
        description: mapWorkflowError(error),
        variant: "destructive",
      });
    },
  });

  const updateVisitType = trpc.workflow.updateVisitType.useMutation({
    onSuccess: async () => {
      await Promise.all([
        invalidateCore(),
        utils.queue.getVisitTypes.invalidate(),
      ]);
      toast({ title: "Visit type updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update visit type",
        description: mapWorkflowError(error),
        variant: "destructive",
      });
    },
  });

  return {
    createDepartment,
    updateDepartment,
    createVisitType,
    updateVisitType,
  };
}
