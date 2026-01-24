import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Hotel profile, currency, and configuration." />
      <Card className="shadow-soft">
        <CardContent className="p-6 text-sm text-muted-foreground">Settings module UI is being wired up.</CardContent>
      </Card>
    </div>
  );
}
