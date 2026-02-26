import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLogin } from "../_hooks/use-login";

const passwordlessSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

export type PasswordlessFormValues = z.infer<typeof passwordlessSchema>;

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export function useLoginForms() {
  const { mode, setMode, continueWithEmail, signInWithPassword, loading } =
    useLogin();

  const passwordlessForm = useForm<PasswordlessFormValues>({
    defaultValues: {
      email: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function handlePasswordlessSubmit(values: PasswordlessFormValues) {
    const result = passwordlessSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof PasswordlessFormValues;
        passwordlessForm.setError(field, { message: issue.message });
      }
      return;
    }
    await continueWithEmail(values.email);
  }

  async function handlePasswordSubmit(values: PasswordFormValues) {
    const result = passwordSchema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof PasswordFormValues;
        passwordForm.setError(field, { message: issue.message });
      }
      return;
    }
    await signInWithPassword(values.email, values.password);
  }

  return {
    mode,
    setMode,
    passwordlessForm,
    passwordForm,
    handlePasswordlessSubmit,
    handlePasswordSubmit,
    loading,
  };
}
