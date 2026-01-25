import { PageHeader } from "@/pages/app/_ui";
import { ModulePlaceholderCard } from "@/pages/app/_placeholders";

export default function Billing() {
  return (
    <div className="space-y-4">
      <PageHeader title="Billing" subtitle="Full-only payments, invoices, and balances." />
      <ModulePlaceholderCard title="Billing">
        Payments, invoices, and customer balances will appear here (matching the new soft-light card/table style).
      </ModulePlaceholderCard>
    </div>
  );
}
