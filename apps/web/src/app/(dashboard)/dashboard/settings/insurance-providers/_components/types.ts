export interface AddInsuranceProviderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerToEdit?: {
    id: number;
    name: string;
    providerCode: string | null;
    billingBasis: "CAPITATION" | "FEE_FOR_SERVICE";
    requiresPreAuth: boolean;
    copayAmount: number;
    shaAccreditationNumber: string | null;
    schemes: {
      id: number;
      name: string;
      billingBasis: "CAPITATION" | "FEE_FOR_SERVICE";
      requiresPreAuth: boolean;
      copayAmount: number;
      isActive: boolean;
    }[];
  } | null;
}
