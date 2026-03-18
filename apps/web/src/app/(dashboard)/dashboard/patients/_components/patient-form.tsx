"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import { SubmitButton } from "@visyx/ui/submit-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@visyx/ui/tabs";
import { isPast, parseISO } from "date-fns";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { type FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useBranch } from "@/app/(dashboard)/dashboard/branch-context";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { formatAge } from "@/lib/age-formatter";
import { type RouterInputs, trpc } from "@/trpc/client";

const EAST_AFRICAN_COUNTRIES = [
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Burundi",
  "South Sudan",
  "Ethiopia",
  "Somalia",
] as const;

type CreatePatientInput = RouterInputs["patients"]["create"];

type PatientFormValues = CreatePatientInput & {
  // UI-only helpers can go here later if needed
};

const patientFormSchema = z.object({
  // Basic
  salutation: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  maritalStatus: z
    .enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "SEPARATED", "OTHER"])
    .optional(),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"])
    .optional(),

  // Contact
  email: z
    .union([z.literal(""), z.string().email("Invalid email address")])
    .optional(),
  phone: z.string().optional(),
  country: z.string().default("Kenya"),
  address: z.string().optional(),

  // IDs
  passportNumber: z.string().optional(),
  nationalId: z.string().optional(),
  nhifNumber: z.string().optional(),

  // Branch (required)
  branchId: z.number().int().positive("Branch is required"),

  // Kin
  kin: z
    .array(
      z.object({
        isPrimary: z.boolean().optional(),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        relationship: z.string().optional(),
        phone: z.string().optional(),
        email: z
          .union([z.literal(""), z.string().email("Invalid email address")])
          .optional(),
        nationalId: z.string().optional(),
      }),
    )
    .optional(),

  // Guarantor
  guarantor: z
    .array(
      z.object({
        isPrimary: z.boolean().optional(),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        relationship: z.string().optional(),
        phone: z.string().optional(),
        email: z
          .union([z.literal(""), z.string().email("Invalid email address")])
          .optional(),
        nationalId: z.string().optional(),
        employer: z.string().optional(),
      }),
    )
    .optional(),

  // Insurance
  insurance: z
    .object({
      providerId: z.number().int().optional(),
      memberNumber: z.string().optional(),
      principalName: z.string().optional(),
      principalRelationship: z.string().optional(),
      expiresAt: z.string().optional(),
    })
    .optional(),
});

type PatientFormProps = {
  defaultValues: PatientFormValues;
  onSubmit: (values: CreatePatientInput) => Promise<void> | void;
  submitting?: boolean;
  cancelHref: string;
};

function tabHasErrors(
  tab: string,
  errors: FieldErrors<PatientFormValues>,
): boolean {
  const keys = new Set(Object.keys(errors));

  if (tab === "basic") {
    return (
      keys.has("salutation") ||
      keys.has("firstName") ||
      keys.has("middleName") ||
      keys.has("lastName") ||
      keys.has("dateOfBirth") ||
      keys.has("gender") ||
      keys.has("maritalStatus") ||
      keys.has("bloodGroup") ||
      keys.has("branchId") ||
      keys.has("email") ||
      keys.has("phone") ||
      keys.has("country") ||
      keys.has("address")
    );
  }

  if (tab === "ids") {
    return (
      keys.has("passportNumber") ||
      keys.has("nationalId") ||
      keys.has("nhifNumber")
    );
  }

  if (tab === "kin") {
    return Boolean(errors.kin);
  }

  if (tab === "guarantor") {
    return Boolean(errors.guarantor);
  }

  if (tab === "insurance") {
    return Boolean(errors.insurance);
  }

  return false;
}

const TABS_ORDER = ["basic", "ids", "kin", "guarantor", "insurance"] as const;
type TabType = (typeof TABS_ORDER)[number];

export function PatientForm({
  defaultValues,
  onSubmit,
  submitting,
  cancelHref,
}: PatientFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const { branches, activeBranchId } = useBranch();
  const { allowed: canUseInsurance } = useHasPermission(
    "billing:manage_insurance_providers",
  );
  const { data: providers } = trpc.billing.insurance.listProviders.useQuery(
    undefined,
    { enabled: canUseInsurance },
  );

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      ...defaultValues,
      branchId: defaultValues.branchId ?? activeBranchId ?? 0,
      kin: defaultValues.kin ?? [],
      guarantor: defaultValues.guarantor ?? [],
    },
  });

  const {
    fields: kinFields,
    append: appendKin,
    remove: removeKin,
  } = useFieldArray({
    control: form.control,
    name: "kin",
  });

  const {
    fields: guarantorFields,
    append: appendGuarantor,
    remove: removeGuarantor,
  } = useFieldArray({
    control: form.control,
    name: "guarantor",
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values as unknown as CreatePatientInput);
  });

  const handleTabChange = async (value: string) => {
    const nextTabIndex = TABS_ORDER.indexOf(value as TabType);
    const currentIndex = TABS_ORDER.indexOf(activeTab);

    // Only validate if moving forward
    if (nextTabIndex > currentIndex) {
      // Validate current tab before moving forward
      let isValid = true;
      if (activeTab === "basic") {
        isValid = await form.trigger([
          "firstName",
          "lastName",
          "branchId",
          "email",
          "salutation",
          "middleName",
          "dateOfBirth",
          "gender",
          "maritalStatus",
          "bloodGroup",
          "phone",
          "country",
          "address",
        ]);
      } else if (activeTab === "ids") {
        isValid = await form.trigger([
          "nationalId",
          "passportNumber",
          "nhifNumber",
        ]);
      } else if (activeTab === "kin") {
        isValid = await form.trigger(["kin"]);
      } else if (activeTab === "guarantor") {
        isValid = await form.trigger(["guarantor"]);
      }

      if (!isValid) return; // Prevent navigation if invalid
    }

    setActiveTab(value as TabType);
  };

  const currentDob = form.watch("dateOfBirth");
  const currentExpiry = form.watch("insurance.expiresAt");
  const isInsuranceExpired = currentExpiry
    ? isPast(parseISO(currentExpiry))
    : false;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CardHeader>
          <CardTitle className="text-base">Patient registration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.formState.isSubmitted && !form.formState.isValid ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Please review the highlighted fields. Some tabs contain missing or
              invalid details.
            </div>
          ) : null}

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-2 w-full justify-start rounded-md border border-border bg-background/60 px-1">
              {["basic", "ids", "kin", "guarantor", "insurance"].map((tab) => {
                const hasError = tabHasErrors(tab, form.formState.errors);
                const labelMap: Record<string, string> = {
                  basic: "Basic information",
                  ids: "IDs",
                  kin: "Next of kin",
                  guarantor: "Guarantor",
                  insurance: "Insurance",
                };
                return (
                  <TabsTrigger key={tab} value={tab} className="gap-1 px-4">
                    <span>{labelMap[tab]}</span>
                    {hasError ? (
                      <span className="ml-1 h-1.5 w-1.5 rounded-full bg-destructive" />
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="branchId">
                  Branch <span className="text-destructive">*</span>
                </Label>
                {activeBranchId ? (
                  <>
                    <Input
                      id="branchId"
                      value={
                        branches.find((b) => b.id === activeBranchId)?.name ??
                        "Current branch"
                      }
                      disabled
                      className="bg-muted text-foreground/90"
                    />
                    {/* Keep branchId in the form state for submission */}
                    <input
                      type="hidden"
                      {...form.register("branchId", { valueAsNumber: true })}
                    />
                    {form.formState.errors.branchId ? (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.branchId.message}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <select
                      id="branchId"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...form.register("branchId", { valueAsNumber: true })}
                    >
                      <option value={0}>Select branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.branchId ? (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.branchId.message}
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="salutation">Title (optional)</Label>
                  <Input
                    id="salutation"
                    placeholder="Mr / Mrs / Ms"
                    {...form.register("salutation")}
                  />
                  {form.formState.errors.salutation ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.salutation.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Jane"
                    autoFocus
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.firstName.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle name</Label>
                  <Input
                    id="middleName"
                    placeholder="W."
                    {...form.register("middleName")}
                  />
                  {form.formState.errors.middleName ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.middleName.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.lastName.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    Date of birth
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      {currentDob ? `(Age: ${formatAge(currentDob)})` : ""}
                    </span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                  />
                  {form.formState.errors.dateOfBirth ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.dateOfBirth.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register("gender")}
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {form.formState.errors.gender ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.gender.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital status</Label>
                  <select
                    id="maritalStatus"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register("maritalStatus")}
                  >
                    <option value="">Select</option>
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                    <option value="SEPARATED">Separated</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {form.formState.errors.maritalStatus ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.maritalStatus.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="bloodGroup">Blood group</Label>
                  <select
                    id="bloodGroup"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register("bloodGroup")}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                  {form.formState.errors.bloodGroup ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.bloodGroup.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+254700000000"
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.phone.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="patient@example.com"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register("country")}
                  >
                    {EAST_AFRICAN_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.country ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.country.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Address / estate / town"
                    {...form.register("address")}
                  />
                  {form.formState.errors.address ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.address.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ids" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID</Label>
                  <Input
                    id="nationalId"
                    placeholder="ID number"
                    {...form.register("nationalId")}
                  />
                  {form.formState.errors.nationalId ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.nationalId.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Passport</Label>
                  <Input
                    id="passportNumber"
                    placeholder="Passport number"
                    {...form.register("passportNumber")}
                  />
                  {form.formState.errors.passportNumber ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.passportNumber.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nhifNumber">NHIF</Label>
                  <Input
                    id="nhifNumber"
                    placeholder="NHIF number"
                    {...form.register("nhifNumber")}
                  />
                  {form.formState.errors.nhifNumber ? (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.nhifNumber.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="kin" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Next of kin</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    appendKin({
                      firstName: "",
                      lastName: "",
                      isPrimary: kinFields.length === 0,
                    })
                  }
                >
                  Add contact
                </Button>
              </div>
              {kinFields.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No emergency contacts added. Add at least one for high‑risk
                  cases.
                </p>
              ) : null}
              <div className="space-y-4">
                {kinFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-md border border-border p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">Contact {index + 1}</p>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            className="h-3 w-3"
                            {...form.register(
                              `kin.${index}.isPrimary` as const,
                            )}
                          />
                          Primary
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-xs"
                          onClick={() => removeKin(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">First name</Label>
                        <Input
                          {...form.register(`kin.${index}.firstName` as const)}
                        />
                        {form.formState.errors.kin?.[index]?.firstName ? (
                          <p className="text-destructive text-[10px]">
                            {
                              form.formState.errors.kin?.[index]?.firstName
                                ?.message
                            }
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Last name</Label>
                        <Input
                          {...form.register(`kin.${index}.lastName` as const)}
                        />
                        {form.formState.errors.kin?.[index]?.lastName ? (
                          <p className="text-destructive text-[10px]">
                            {
                              form.formState.errors.kin?.[index]?.lastName
                                ?.message
                            }
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Relationship</Label>
                        <Input
                          {...form.register(
                            `kin.${index}.relationship` as const,
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input
                          {...form.register(`kin.${index}.phone` as const)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          {...form.register(`kin.${index}.email` as const)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="guarantor" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Guarantors</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    appendGuarantor({
                      firstName: "",
                      lastName: "",
                      isPrimary: guarantorFields.length === 0,
                    })
                  }
                >
                  Add guarantor
                </Button>
              </div>
              {guarantorFields.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Optional. Add guarantors for credit or corporate patients.
                </p>
              ) : null}
              <div className="space-y-4">
                {guarantorFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-md border border-border p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">
                        Guarantor {index + 1}
                      </p>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            className="h-3 w-3"
                            {...form.register(
                              `guarantor.${index}.isPrimary` as const,
                            )}
                          />
                          Primary
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-xs"
                          onClick={() => removeGuarantor(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">First name</Label>
                        <Input
                          {...form.register(
                            `guarantor.${index}.firstName` as const,
                          )}
                        />
                        {form.formState.errors.guarantor?.[index]?.firstName ? (
                          <p className="text-destructive text-[10px]">
                            {
                              form.formState.errors.guarantor?.[index]
                                ?.firstName?.message
                            }
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Last name</Label>
                        <Input
                          {...form.register(
                            `guarantor.${index}.lastName` as const,
                          )}
                        />
                        {form.formState.errors.guarantor?.[index]?.lastName ? (
                          <p className="text-destructive text-[10px]">
                            {
                              form.formState.errors.guarantor?.[index]?.lastName
                                ?.message
                            }
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Relationship</Label>
                        <Input
                          {...form.register(
                            `guarantor.${index}.relationship` as const,
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone</Label>
                        <Input
                          {...form.register(
                            `guarantor.${index}.phone` as const,
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Employer</Label>
                        <Input
                          {...form.register(
                            `guarantor.${index}.employer` as const,
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {canUseInsurance ? (
              <TabsContent value="insurance" className="space-y-4">
                <div className="space-y-4 rounded-md border border-border p-4">
                  <p className="text-sm font-medium">Primary Insurance</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="insurance.providerId">
                        Provider <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id="insurance.providerId"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...form.register("insurance.providerId", {
                          valueAsNumber: true,
                        })}
                      >
                        <option value={0}>Select provider</option>
                        {(providers ?? []).map((provider: any) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                      {form.formState.errors.insurance?.providerId ? (
                        <p className="text-destructive text-xs">
                          {form.formState.errors.insurance?.providerId?.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance.memberNumber">
                        Member / Card Number{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="insurance.memberNumber"
                        {...form.register("insurance.memberNumber")}
                      />
                      {form.formState.errors.insurance?.memberNumber ? (
                        <p className="text-destructive text-xs">
                          {
                            form.formState.errors.insurance?.memberNumber
                              ?.message
                          }
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="insurance.principalName">
                        Principal Name
                      </Label>
                      <Input
                        id="insurance.principalName"
                        placeholder="If dependent"
                        {...form.register("insurance.principalName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance.principalRelationship">
                        Relationship
                      </Label>
                      <Input
                        id="insurance.principalRelationship"
                        placeholder="e.g. Spouse"
                        {...form.register("insurance.principalRelationship")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance.expiresAt">Expiry Date</Label>
                      <Input
                        id="insurance.expiresAt"
                        type="date"
                        {...form.register("insurance.expiresAt")}
                      />
                    </div>
                  </div>

                  {isInsuranceExpired && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <p>
                        This insurance policy appears to have expired. Please
                        verify with the patient or provider.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ) : (
              <TabsContent value="insurance" className="space-y-2">
                <p className="text-sm font-medium">Insurance</p>
                <p className="text-xs text-muted-foreground">
                  You do not have permission to view insurance providers.
                  Contact an administrator if you need access.
                </p>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="justify-between border-t bg-muted/20 px-6 py-4">
          <Button variant="outline" asChild>
            <Link href={cancelHref}>Cancel</Link>
          </Button>

          <div className="flex items-center gap-2">
            {activeTab !== "insurance" && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const currentIndex = TABS_ORDER.indexOf(activeTab);
                  if (currentIndex < TABS_ORDER.length - 1) {
                    handleTabChange(TABS_ORDER[currentIndex + 1]!);
                  }
                }}
              >
                Next step
              </Button>
            )}
            {activeTab === "insurance" && (
              <SubmitButton isSubmitting={submitting ?? false}>
                {submitting ? "Saving..." : "Save patient"}
              </SubmitButton>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
