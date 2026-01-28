import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@testing-library/dom";

import { renderWithQuery } from "@/test/testUtils";
import Customers from "@/pages/app/Customers";

vi.mock("@/components/ui/sonner", () => ({ toast: vi.fn() }));

vi.mock("@/pages/app/customers/CustomerDialog", () => ({ CustomerDialog: () => null }));
vi.mock("@/pages/app/customers/CustomerDetailDialog", () => ({ CustomerDetailDialog: () => null }));

let rows: Array<any> = [];
vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => {
    if (table !== "customers") throw new Error(`Unexpected table: ${table}`);
    const selectBuilder: any = {
      order: () => selectBuilder,
      or: () => selectBuilder,
      then: (resolve: any, reject: any) => Promise.resolve({ data: rows, error: null }).then(resolve, reject),
    };

    return {
      select: () => selectBuilder,
      delete: () => ({
        eq: async (_col: string, id: string) => {
          rows = rows.filter((r) => r.id !== id);
          return { error: null };
        },
      }),
      insert: async () => ({ error: null }),
      update: () => ({ eq: async () => ({ error: null }) }),
    } as any;
  };

  return { supabase: { from } };
});

describe("Customers page", () => {
  it("deletes a customer and updates the UI after success", async () => {
    const user = userEvent.setup();

    rows = [
      {
        id: "c1",
        first_name: "John",
        last_name: "Doe",
        email: "john@doe.com",
        phone: null,
        created_at: "2026-01-01",
      },
    ];

    const { unmount } = renderWithQuery(<Customers />);

    expect(await screen.findByText("John Doe")).toBeInTheDocument();

    // Open confirm
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");

    // Confirm delete
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("No customers yet.")).toBeInTheDocument();
    unmount();
  });
});
