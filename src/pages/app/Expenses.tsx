import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";

export default function Expenses() {
  return (
    <div>
      <PageHeader title="Expenses" subtitle="Categorized operational expenses with receipts." />
      <Card className="shadow-soft">
        <CardContent className="p-6 text-sm text-muted-foreground">Expenses module UI is being wired up.</CardContent>
      </Card>
    </div>
  );
}
