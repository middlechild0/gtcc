import { trpc } from "@/trpc/client";

export function useStaffSecurity(staffId: number | null | undefined) {
  const id =
    typeof staffId === "number" && Number.isFinite(staffId) ? staffId : null;

  const changePassword = trpc.staff.changePassword.useMutation();
  const sendPasswordReset = trpc.staff.sendPasswordReset.useMutation();

  return {
    changePassword,
    sendPasswordReset,
    staffId: id,
    isReady: id != null,
  };
}
