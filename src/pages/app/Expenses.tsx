import { PageHeader } from "@/pages/app/_ui";
import { ModulePlaceholderCard } from "@/pages/app/_placeholders";

export default function Expenses() {
  return (
    <div className="space-y-4">
      <PageHeader title="Expenses" subtitle="Categorized operational expenses with receipts." />
      <ModulePlaceholderCard title="Expenses">
        Add and track expenses by category, attach receipts, and export to reports.
      </ModulePlaceholderCard>
    </div>
  );
}
