"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

export function useInsuranceProviders() {
    const utils = trpc.useUtils();

    const { data: providers, isLoading } = trpc.billing.insurance.listProviders.useQuery();

    const create = trpc.billing.insurance.createProvider.useMutation({
        onSuccess: async () => {
            await utils.billing.insurance.listProviders.invalidate();
            toast.success("Insurance provider added");
        },
        onError: (err) => {
            toast.error(err.message ?? "Failed to add insurance provider");
        },
    });

    const update = trpc.billing.insurance.updateProvider.useMutation({
        onSuccess: async () => {
            await utils.billing.insurance.listProviders.invalidate();
            toast.success("Insurance provider updated");
        },
        onError: (err) => {
            toast.error(err.message ?? "Failed to update insurance provider");
        },
    });

    return {
        providers,
        isLoading,
        create,
        update
    };
}
