import { PageHeader } from "@/pages/app/_ui";
import { ModulePlaceholderCard } from "@/pages/app/_placeholders";

export default function Inventory() {
  return (
    <div className="space-y-4">
      <PageHeader title="Inventory" subtitle="Stock levels, movements, and low-stock alerts." />
      <ModulePlaceholderCard title="Inventory">
        Inventory items, stock movements, and low-stock alerts will be managed here.
      </ModulePlaceholderCard>
    </div>
  );
}
