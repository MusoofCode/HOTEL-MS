import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";

export default function Customers() {
  return (
    <div>
      <PageHeader title="Customers" subtitle="Customer profiles and booking history." />
      <Card className="shadow-soft">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Customers module UI is being wired up.
        </CardContent>
      </Card>
    </div>
  );
}
