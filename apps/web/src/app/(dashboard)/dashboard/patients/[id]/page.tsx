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
import { Separator } from "@visyx/ui/separator";
import { format } from "date-fns";
import { ArrowLeft, Edit, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { trpc } from "@/trpc/client";

export default function PatientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { hasPermission } = useAuth();
  const { data: patient, isLoading } = trpc.patients.get.useQuery({ id });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-md bg-muted" />
          <div className="h-64 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <h2 className="text-xl font-semibold">Patient not found</h2>
        <p className="mt-2 text-muted-foreground">
          The requested patient record could not be found.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard/patients">Back to Patients</Link>
        </Button>
      </div>
    );
  }

  const fullName = [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <RouteGuard required="patients:view">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/patients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Link>
          </Button>
          {hasPermission("patients:edit") && (
            <Button asChild size="sm">
              <Link href={`/dashboard/patients/${patient.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          )}
        </div>

        {/* Profile Card Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {patient.salutation ? `${patient.salutation} ` : ""}
                {fullName}
              </h1>
              <Badge variant={patient.isActive ? "default" : "secondary"}>
                {patient.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="mt-2 flex items-center gap-2 text-muted-foreground">
              <span className="font-mono text-sm tracking-wider">
                {patient.patientNumber}
              </span>
              <span>•</span>
              <span>
                Registered on{" "}
                {format(new Date(patient.createdAt as unknown as string), "PP")}
              </span>
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Date of Birth
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {patient.dateOfBirth
                    ? format(new Date(patient.dateOfBirth), "PP")
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Gender
                </dt>
                <dd className="mt-1 text-sm font-medium capitalize">
                  {patient.gender?.toLowerCase() || "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Marital Status
                </dt>
                <dd className="mt-1 text-sm font-medium capitalize">
                  {patient.maritalStatus?.toLowerCase() || "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Blood Group
                </dt>
                <dd className="mt-1 text-sm font-medium capitalize">
                  {patient.bloodGroup?.toLowerCase() || "Not specified"}
                </dd>
              </div>
              <div className="col-span-2">
                <Separator className="my-2" />
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  National ID
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {patient.nationalId || "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Passport
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {patient.passportNumber || "Not specified"}
                </dd>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {patient.phone || "Not specified"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {patient.email || "Not specified"}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col text-sm font-medium">
                  <span>{patient.address || "Address not specified"}</span>
                  <span className="text-muted-foreground font-normal">
                    {patient.country || "Kenya"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          {patient.insurance && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Insurance Coverage</CardTitle>
                <CardDescription>
                  Primary health insurance provider details.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Provider ID
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {patient.insurance.providerId}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Member Number
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {patient.insurance.memberNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Principal
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {patient.insurance.principalName || "Self"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Relationship
                  </dt>
                  <dd className="mt-1 text-sm font-medium capitalize">
                    {patient.insurance.principalRelationship || "N/A"}
                  </dd>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kin & Guarantor Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:col-span-3">
            {/* Next of Kin Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Next of Kin</CardTitle>
                <CardDescription>
                  Emergency contacts for the patient.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patient.kin && patient.kin.length > 0 ? (
                  <div className="space-y-4">
                    {patient.kin.map((kin, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 rounded-md border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {kin.firstName} {kin.lastName}
                          </span>
                          {kin.isPrimary && (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase"
                            >
                              Primary
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {kin.relationship || "Unknown Relationship"}
                        </span>
                        <div className="mt-2 flex flex-col gap-1 text-sm">
                          {kin.phone && (
                            <span className="text-muted-foreground">
                              📞 {kin.phone}
                            </span>
                          )}
                          {kin.email && (
                            <span className="text-muted-foreground">
                              ✉️ {kin.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No next of kin recorded.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Guarantor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Guarantors</CardTitle>
                <CardDescription>
                  Financial guarantors linked to the patient.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patient.guarantor && patient.guarantor.length > 0 ? (
                  <div className="space-y-4">
                    {patient.guarantor.map((g, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 rounded-md border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {g.firstName} {g.lastName}
                          </span>
                          {g.isPrimary && (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase"
                            >
                              Primary
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {g.relationship || "Unknown Relationship"}{" "}
                          {g.employer ? `• ${g.employer}` : ""}
                        </span>
                        <div className="mt-2 flex flex-col gap-1 text-sm">
                          {g.phone && (
                            <span className="text-muted-foreground">
                              📞 {g.phone}
                            </span>
                          )}
                          {g.email && (
                            <span className="text-muted-foreground">
                              ✉️ {g.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No guarantors recorded.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
