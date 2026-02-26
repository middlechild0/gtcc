import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import { cn } from "@visyx/ui/cn";
import { AlertCircle } from "lucide-react";

type NoPermissionProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function NoPermission(props: NoPermissionProps) {
  const {
    title = "You don't have access to this area",
    description = "If you believe this is a mistake, contact an administrator to adjust your permissions.",
    className,
  } = props;

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="rounded-full bg-destructive/10 p-2 text-destructive">
          <AlertCircle className="size-5" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
