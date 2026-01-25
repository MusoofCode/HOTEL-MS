import { PageHeader } from "@/pages/app/_ui";
import { ModulePlaceholderCard } from "@/pages/app/_placeholders";

export default function Reservations() {
  return (
    <div className="space-y-4">
      <PageHeader title="Reservations" subtitle="Create bookings with conflict-proof availability." />
      <ModulePlaceholderCard title="Reservations">
        Reservation creation, availability checks, and payment flows are next in the build queue.
      </ModulePlaceholderCard>
    </div>
  );
}
