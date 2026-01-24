import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";

export default function Reservations() {
  return (
    <div>
      <PageHeader title="Reservations" subtitle="Create bookings with conflict-proof availability." />
      <Card className="shadow-soft">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Reservations module UI is being wired up.
        </CardContent>
      </Card>
    </div>
  );
}
