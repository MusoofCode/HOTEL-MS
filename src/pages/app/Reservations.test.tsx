import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@testing-library/dom";

import { renderWithQuery } from "@/test/testUtils";
import Reservations from "@/pages/app/Reservations";

vi.mock("@/components/ui/sonner", () => ({ toast: vi.fn() }));
vi.mock("@/pages/app/reservations/ReservationDialog", () => ({ ReservationDialog: () => null }));

let reservationDetails: Array<any> = [];
vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => {
    if (table === "reservation_details") {
      const selectBuilder: any = {
        order: () => selectBuilder,
        or: () => selectBuilder,
        then: (resolve: any, reject: any) => Promise.resolve({ data: reservationDetails, error: null }).then(resolve, reject),
      };
      return { select: () => selectBuilder } as any;
    }

    if (table === "customers") {
      const selectBuilder: any = {
        order: () => selectBuilder,
        then: (resolve: any, reject: any) =>
          Promise.resolve({ data: [{ id: "cust1", first_name: "John", last_name: "Doe" }], error: null }).then(resolve, reject),
      };
      return { select: () => selectBuilder } as any;
    }

    if (table === "rooms") {
      const selectBuilder: any = {
        order: () => selectBuilder,
        then: (resolve: any, reject: any) =>
          Promise.resolve({ data: [{ id: "room1", room_number: "101" }], error: null }).then(resolve, reject),
      };
      return { select: () => selectBuilder } as any;
    }

    if (table === "reservations") {
      return {
        update: (_payload: any) => ({
          eq: async (_col: string, id: string) => {
            reservationDetails = reservationDetails.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r));
            return { error: null };
          },
        }),
      } as any;
    }

    throw new Error(`Unexpected table: ${table}`);
  };

  return { supabase: { from } };
});

describe("Reservations page", () => {
  it("cancels a reservation and refreshes the UI after success", async () => {
    const user = userEvent.setup();

    reservationDetails = [
      {
        id: "r1",
        status: "confirmed",
        first_name: "John",
        last_name: "Doe",
        room_number: "101",
        check_in_date: "2026-02-01",
        check_out_date: "2026-02-02",
        nights: 1,
        total_amount: 100,
        balance_due: 100,
      },
    ];

    renderWithQuery(<Reservations />);

    expect(await screen.findByText("confirmed")).toBeInTheDocument();

    // Open confirm dialog (trigger button)
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    const dialog = await screen.findByRole("alertdialog");

    // Confirm cancel
    const cancelButtons = within(dialog).getAllByRole("button", { name: "Cancel" });
    await user.click(cancelButtons[cancelButtons.length - 1]!);

    expect(await screen.findByText("cancelled")).toBeInTheDocument();
  });
});
