import { PageHeader } from "@/pages/app/_ui";
import { ModulePlaceholderCard } from "@/pages/app/_placeholders";

export default function Reports() {
  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle="Daily, monthly, and custom-range exports." />
      <ModulePlaceholderCard title="Reports">
        Export daily/monthly summaries and custom date ranges with the same soft-light table layout.
      </ModulePlaceholderCard>
    </div>
  );
}
