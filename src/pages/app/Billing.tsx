import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";

export default function Billing() {
  return (
    <div>
      <PageHeader title="Billing" subtitle="Full-only payments, invoices, and balances." />
      <Card className="shadow-soft">
        <CardContent className="p-6 text-sm text-muted-foreground">Billing module UI is being wired up.</CardContent>
      </Card>
    </div>
  );
}
