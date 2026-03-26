"use client";

import { Button } from "@visyx/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@visyx/ui/tabs";
import { RefreshCw } from "lucide-react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { DashboardHeader } from "../_components/dashboard-header";
import { ForbiddenBanner } from "../_components/forbidden-banner";
import { WorkflowDepartmentsTable } from "./_components/workflow-departments-table";
import { WorkflowVisitTypesTable } from "./_components/workflow-visit-types-table";
import { useWorkflowData } from "./_hooks/use-workflow-config";
import { isForbiddenError } from "./_utils/error-map";

export default function WorkflowSettingsPage() {
  const { allowed } = useHasPermission("queue:configure_workflows");
  const { departments, visitTypes } = useWorkflowData(allowed);

  const forbidden =
    isForbiddenError(departments.error) || isForbiddenError(visitTypes.error);

  if (forbidden) {
    return <ForbiddenBanner />;
  }

  return (
    <RouteGuard
      required="queue:configure_workflows"
      fallback={<ForbiddenBanner />}
    >
      <div className="flex flex-col gap-6">
        <DashboardHeader
          title="Workflow Configuration"
          description="Manage departments and visit type routing workflows."
          action={
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh workflow configuration"
              onClick={() => {
                void departments.refetch();
                void visitTypes.refetch();
              }}
            >
              <RefreshCw className="size-4" />
            </Button>
          }
        />

        <Tabs defaultValue="departments">
          <TabsList className="border border-border bg-muted/40 text-foreground">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="visit-types">Visit Types</TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="mt-4">
            <WorkflowDepartmentsTable
              items={departments.data ?? []}
              isLoading={departments.isLoading}
              error={departments.error?.message}
            />
          </TabsContent>

          <TabsContent value="visit-types" className="mt-4">
            <WorkflowVisitTypesTable
              items={visitTypes.data ?? []}
              departments={departments.data ?? []}
              isLoading={visitTypes.isLoading}
              error={visitTypes.error?.message}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RouteGuard>
  );
}
