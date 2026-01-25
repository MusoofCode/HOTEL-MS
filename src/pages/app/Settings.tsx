import { PageHeader } from "@/pages/app/_ui";
import { ModulePlaceholderCard } from "@/pages/app/_placeholders";

export default function Settings() {
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Hotel profile, currency, and configuration." />
      <ModulePlaceholderCard title="Settings">
        Property settings, currency, taxes/fees, and operational defaults will live here.
      </ModulePlaceholderCard>
    </div>
  );
}
