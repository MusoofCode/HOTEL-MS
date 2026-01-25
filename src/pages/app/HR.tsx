import { PageHeader } from "@/pages/app/_ui";
import { ModulePlaceholderCard } from "@/pages/app/_placeholders";

export default function HR() {
  return (
    <div className="space-y-4">
      <PageHeader title="HR Records" subtitle="Admin-only staff records (no staff logins)." />
      <ModulePlaceholderCard title="HR Records">
        Staff profiles, documents, and role/department info will be managed here (admin-only).
      </ModulePlaceholderCard>
    </div>
  );
}
