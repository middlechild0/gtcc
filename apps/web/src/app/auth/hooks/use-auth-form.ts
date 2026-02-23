import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";

export type AuthFormValues = {
  email: string;
  password?: string;
  name?: string;
};

type UseAuthFormOptions = {
  defaultValues?: Partial<AuthFormValues>;
  onSubmit: SubmitHandler<AuthFormValues>;
};

export function useAuthForm({ defaultValues, onSubmit }: UseAuthFormOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AuthFormValues>({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting,
  };
}

