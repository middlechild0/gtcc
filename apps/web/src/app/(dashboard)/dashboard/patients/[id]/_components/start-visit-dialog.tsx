"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useBranch } from "../../../branch-context";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@visyx/ui/select";
import { useToast } from "@visyx/ui/use-toast";

const formSchema = z.object({
    visitTypeId: z.string().min(1, "Please select a visit type."),
    priority: z.enum(["NORMAL", "URGENT"]),
});

type StartVisitFormValues = z.infer<typeof formSchema>;

interface StartVisitDialogProps {
    patientId: string;
    patientName: string;
}

export function StartVisitDialog({ patientId, patientName }: StartVisitDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const utils = trpc.useUtils();
    const { activeBranchId: branchId } = useBranch();

    const { data: visitTypes, isLoading: isLoadingTypes } = trpc.queue.getVisitTypes.useQuery(undefined, {
        enabled: open,
    });

    const startVisitMut = trpc.queue.startVisit.useMutation({
        onSuccess: (data) => {
            toast({
                title: "Visit Started",
                description: `${patientName} has been added to the queue (Ticket #${data.ticketNumber}).`,
            });
            utils.queue.invalidate();
            setOpen(false);
            form.reset();
            // Optionally redirect to the queue overview or keep them here
            // router.push("/dashboard/queue");
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
        },
    });

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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Start Visit for {patientName}</DialogTitle>
                    <DialogDescription>
                        Add this patient to the active clinic queue. A draft invoice will be automatically generated.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="visitTypeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Visit Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue
                                                    placeholder={
                                                        isLoadingTypes
                                                            ? "Loading visit types..."
                                                            : visitTypes?.length
                                                                ? "Select a valid reason for visit"
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
                                                    No active visit types configured. Please configure visit
                                                    types in settings.
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

                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Queue Priority</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select patient priority" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="NORMAL">Normal</SelectItem>
                                            <SelectItem value="URGENT">Urgent (Emergency)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setOpen(false)}
                                disabled={startVisitMut.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={startVisitMut.isPending || !visitTypes?.length}>
                                {startVisitMut.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Confirm Visit
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
