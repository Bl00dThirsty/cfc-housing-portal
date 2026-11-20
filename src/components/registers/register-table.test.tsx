import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/data-table/use-data-table", () => ({
  useDataTable: () => ({ rows: [], query: "", setQuery: vi.fn() }),
}));
vi.mock("@/components/ui/toaster", () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { RegisterTable } from "./register-table";

describe("RegisterTable", () => {
  it("renders an explicit empty state instead of fabricated rows", () => {
    render(<RegisterTable registerKey="promoters" records={[]} />);
    expect(screen.getByText(/aucune fiche/i)).toBeTruthy();
  });
});
