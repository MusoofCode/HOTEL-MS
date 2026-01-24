import { PageHeader } from "@/pages/app/_ui";
import { Card, CardContent } from "@/components/ui/card";

export default function HR() {
  return (
    <div>
      <PageHeader title="HR Records" subtitle="Admin-only staff records (no staff logins)." />
      <Card className="shadow-soft">
        <CardContent className="p-6 text-sm text-muted-foreground">HR module UI is being wired up.</CardContent>
      </Card>
    </div>
  );
}
