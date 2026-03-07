"use client";

import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PatientsHeader } from "@/app/(dashboard)/dashboard/patients/_components/patients-header";
import { PatientsTable } from "@/app/(dashboard)/dashboard/patients/_components/patients-table";
import { usePatientKpis } from "@/app/(dashboard)/dashboard/patients/_hooks/use-patient-kpis";
import { usePatientsList } from "@/app/(dashboard)/dashboard/patients/_hooks/use-patients-list";
import { RouteGuard } from "@/app/auth/components/route-guard";

function PatientsContent() {
  const { kpis, isLoading: kpisLoading } = usePatientKpis();
  const {
    filteredPatients,
    totalFiltered,
    search,
    setSearch,
    isLoading,
    error,
    refetch,
    pagination,
  } = usePatientsList();

  return (
    <div className="space-y-8">
      <PatientsHeader
        title="Patients"
        description="Manage and view patient records."
        actions={
          <>
            <Button asChild>
              <Link href="/dashboard/patients/new">
                <Plus className="mr-2 size-4" />
                New patient
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh patients"
              onClick={() => {
                void refetch();
              }}
            >
              <RefreshCw className="size-4" />
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total patients</CardTitle>
            <CardDescription>All patients in this workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {kpisLoading ? "—" : (kpis?.totalPatients ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active patients</CardTitle>
            <CardDescription>Currently active patient records.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {kpisLoading ? "—" : (kpis?.activePatients ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Registrations</CardTitle>
            <CardDescription>Patients registered this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {kpisLoading ? "—" : ((kpis as any)?.newRegistrationsMonth ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patient list</CardTitle>
          <CardDescription>
            Search and browse registered patients.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <PatientsTable
            patients={filteredPatients}
            isLoading={isLoading}
            error={error}
            emptyMessage={
              totalFiltered === 0
                ? search.trim()
                  ? "No patients match your search."
                  : "No patients found."
                : "No patients found."
            }
            search={search}
            onSearchChange={setSearch}
            pagination={pagination}
            totalFiltered={totalFiltered}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <RouteGuard required="patients:view">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-7 w-40 rounded-md bg-muted" />
            <div className="h-32 rounded-md bg-muted" />
          </div>
        }
      >
        <PatientsContent />
      </Suspense>
    </RouteGuard>
  );
}
