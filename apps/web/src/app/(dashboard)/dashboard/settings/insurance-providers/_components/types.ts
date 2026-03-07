export interface AddInsuranceProviderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    providerToEdit?: {
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
    } | null;
}
