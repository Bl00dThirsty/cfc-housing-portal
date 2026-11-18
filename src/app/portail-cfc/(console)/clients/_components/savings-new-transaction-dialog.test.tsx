import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SavingsNewTransactionDialog } from "./savings-new-transaction-dialog";

describe("SavingsNewTransactionDialog", () => {
  it("reuses the request key on retry and creates a new key when the intent changes", async () => {
    const onSubmit = vi.fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    render(
      <SavingsNewTransactionDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        clientName="Client"
        canWithdraw
      />,
    );

    const amount = screen.getByLabelText("Montant (FCFA)");
    fireEvent.change(amount, { target: { value: "25000" } });
    const submit = screen.getByRole("button", { name: /enregistrer le dépôt/i });

    fireEvent.click(submit);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    fireEvent.click(submit);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[0][0].idempotencyKey).toBe(onSubmit.mock.calls[1][0].idempotencyKey);

    fireEvent.change(amount, { target: { value: "30000" } });
    fireEvent.click(submit);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(3));
    expect(onSubmit.mock.calls[2][0].idempotencyKey).not.toBe(onSubmit.mock.calls[1][0].idempotencyKey);
  });
});
