import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";

export default function Inventory() {
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Stock levels, movements, and low-stock alerts." />
      <Card className="shadow-soft">
        <CardContent className="p-6 text-sm text-muted-foreground">Inventory module UI is being wired up.</CardContent>
      </Card>
    </div>
  );
}
