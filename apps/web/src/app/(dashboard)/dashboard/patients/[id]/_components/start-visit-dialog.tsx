"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@visyx/ui/form";
import { Badge } from "@visyx/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import { useToast } from "@visyx/ui/use-toast";
import { CreditCard, Loader2, Play, ShieldCheck, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";
import { trpc } from "@/trpc/client";
import { useBranch } from "../../../branch-context";

const formSchema = z.object({
  visitTypeId: z.string().min(1, "Please select a visit type."),
  priority: z.enum(["NORMAL", "URGENT"]),
  payerType: z.enum(["CASH", "INSURANCE", "CORPORATE"]),
  /** Only required when payerType === "INSURANCE" */
  insuranceProviderId: z.number().int().positive().optional(),
});

type StartVisitFormValues = z.infer<typeof formSchema>;

interface StartVisitDialogProps {
  patientId: string;
  patientName: string;
}

const PAYER_LABELS = {
  CASH: { label: "Cash / Self-pay", icon: Wallet, color: "text-amber-600" },
  INSURANCE: { label: "Insurance", icon: ShieldCheck, color: "text-blue-600" },
  CORPORATE: { label: "Corporate / Employer", icon: CreditCard, color: "text-violet-600" },
} as const;

export function StartVisitDialog({
  patientId,
  patientName,
}: StartVisitDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const _router = useRouter();
  const utils = trpc.useUtils();
  const { activeBranchId: branchId } = useBranch();

  // Fetch visit types when dialog opens
  const { data: visitTypes, isLoading: isLoadingTypes } =
    trpc.queue.getVisitTypes.useQuery(undefined, { enabled: open });

  // Fetch patient record (includes insurance policy if present)
  const { data: patient } = trpc.patients.get.useQuery(
    { id: patientId },
    { enabled: open },
  );

  const startVisitMut = trpc.queue.startVisit.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Visit Started",
        description: `${patientName} has been added to the queue (Ticket #${data.ticketNumber}).`,
      });
      utils.queue.invalidate();
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to start visit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<StartVisitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitTypeId: "",
      priority: "NORMAL",
      payerType: "CASH",
      insuranceProviderId: undefined,
    },
  });

  const payerType = form.watch("payerType");
  const patientInsurance = patient?.insurance;

  // Auto-fill insurance provider when patient has one on file and user switches to INSURANCE
  useEffect(() => {
    if (payerType === "INSURANCE" && patientInsurance?.providerId) {
      form.setValue("insuranceProviderId", patientInsurance.providerId);
    } else {
      form.setValue("insuranceProviderId", undefined);
    }
  }, [payerType, patientInsurance, form]);

  const onSubmit: SubmitHandler<StartVisitFormValues> = (values) => {
    if (!branchId) {
      toast({
        title: "No active branch",
        description: "Please select an active branch first.",
        variant: "destructive",
      });
      return;
    }

    startVisitMut.mutate({
      patientId,
      branchId,
      visitTypeId: Number(values.visitTypeId),
      priority: values.priority,
      payerType: values.payerType,
      insuranceProviderId:
        values.payerType === "INSURANCE" ? values.insuranceProviderId : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Start Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <div className="space-y-6 p-6 sm:p-8">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold">
              Start visit for <span className="font-bold">{patientName}</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Add this patient to the active clinic queue. A draft invoice will
              be created automatically using the payer's price book.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 pt-2"
            >
              {/* Visit Type */}
              <FormField
                control={form.control}
                name="visitTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Visit type
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              isLoadingTypes
                                ? "Loading visit types..."
                                : visitTypes?.length
                                  ? "Select reason for visit"
                                  : "No active visit types configured"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {isLoadingTypes && (
                          <div className="px-3 py-2 text-muted-foreground text-xs">
                            Loading visit types...
                          </div>
                        )}
                        {!isLoadingTypes && !visitTypes?.length && (
                          <div className="px-3 py-2 text-muted-foreground text-xs">
                            No active visit types configured. Please configure
                            visit types in settings.
                          </div>
                        )}
                        {visitTypes?.map((vt) => (
                          <SelectItem key={vt.id} value={String(vt.id)}>
                            {vt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payer Type */}
              <FormField
                control={form.control}
                name="payerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Payer / Billing mode
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PAYER_LABELS).map(([key, { label, icon: Icon, color }]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${color}`} />
                              {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Insurance Provider — shown only when payerType = INSURANCE */}
              {payerType === "INSURANCE" && (
                <div className="rounded-lg border border-blue-200/60 bg-blue-50/40 px-4 py-3 space-y-3">
                  {patientInsurance ? (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Insurance on file
                        </p>
                        <p className="text-sm font-semibold">
                          Provider ID #{patientInsurance.providerId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Member: {patientInsurance.memberNumber}
                          {patientInsurance.expiresAt && (
                            <span className="ml-2">
                              · Expires {patientInsurance.expiresAt}
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                        Auto-selected
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 border border-amber-200">
                      ⚠ No insurance policy on file for this patient. Add one
                      from the patient profile before starting an insurance
                      visit, or proceed with Cash.
                    </p>
                  )}
                </div>
              )}

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Queue priority
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="URGENT">
                          Urgent (Emergency)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={startVisitMut.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={startVisitMut.isPending || !visitTypes?.length}
                >
                  {startVisitMut.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirm Visit
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
