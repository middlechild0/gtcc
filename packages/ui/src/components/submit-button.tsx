import { cn } from "../utils";
import { Button, type ButtonProps } from "./button";
import { Spinner } from "./spinner";

export function SubmitButton({
  children,
  isSubmitting,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  isSubmitting: boolean;
  disabled?: boolean;
} & ButtonProps) {
  return (
    <Button
      disabled={isSubmitting || disabled}
      {...props}
      className={cn("relative", props.className)}
    >
      <span className={cn(isSubmitting && "invisible")}>{children}</span>
      {isSubmitting && (
        <div className="absolute inset-0 flex items-center justify-center text-inherit">
          <Spinner className="size-5 shrink-0 stroke-current" size={20} />
        </div>
      )}
    </Button>
  );
}
