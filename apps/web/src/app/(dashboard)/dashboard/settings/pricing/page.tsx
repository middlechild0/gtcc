"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@visyx/ui/card";
import Link from "next/link";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { DashboardHeader } from "../_components/dashboard-header";

function PricingNavCard({
  title,
  description,
  href,
  disabled,
}: {
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function PricingHomePage() {
  const pricing = useHasPermission("pricing:view").allowed;
  const catalog = useHasPermission("catalog:view").allowed;

  return (
    <RouteGuard required={["pricing:view", "catalog:view"]} requireAll={false}>
      <div className="flex flex-col gap-6">
        <DashboardHeader
          title="Pricing"
          description="Configure catalog items, price books, and tax rates used during billing."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <PricingNavCard
            title="Catalog"
            description="Manage services/products and the billable items list."
            href="/dashboard/settings/pricing/catalog"
            disabled={!catalog}
          />
          <PricingNavCard
            title="Price books"
            description="Create price books and assign prices per item."
            href="/dashboard/settings/pricing/price-books"
            disabled={!pricing}
          />
          <PricingNavCard
            title="Tax rates"
            description="Configure VAT rates and choose a default."
            href="/dashboard/settings/pricing/tax-rates"
            disabled={!pricing}
          />
        </div>
      </div>
    </RouteGuard>
  );
}
