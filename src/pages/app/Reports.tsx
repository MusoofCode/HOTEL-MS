import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";

export default function Reports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Daily, monthly, and custom-range exports." />
      <Card className="shadow-soft">
        <CardContent className="p-6 text-sm text-muted-foreground">Reports module UI is being wired up.</CardContent>
      </Card>
    </div>
  );
}
