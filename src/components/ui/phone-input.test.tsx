import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PhoneInput } from "@/components/ui/phone-input";

/**
 * Le champ téléphone — ce que l'utilisateur vit.
 *
 * Le regroupement au fil de la frappe, la reconnaissance d'un numéro collé
 * depuis un autre pays, et l'annonce du refus : ce sont les trois moments où
 * un champ de téléphone trahit l'utilisateur.
 */

describe("champ téléphone", () => {
  it("regroupe la saisie et remonte la forme internationale", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PhoneInput id="phone" value="" onChange={onChange} />);

    const input = screen.getByLabelText(/téléphone/i);
    await user.type(input, "699000001");

    expect(onChange).toHaveBeenLastCalledWith("+237699000001");
    expect(input).toHaveValue("6 99 00 00 01");
  });

  it("retire l'indicatif collé et suit le pays du numéro", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCountryChange = vi.fn();

    render(
      <PhoneInput
        id="phone"
        value=""
        onChange={onChange}
        onCountryChange={onCountryChange}
      />,
    );

    const input = screen.getByLabelText(/téléphone/i);
    await user.click(input);
    await user.paste("+33 6 12 34 56 78");

    expect(onCountryChange).toHaveBeenCalledWith("FR");
    expect(onChange).toHaveBeenLastCalledWith("+33612345678");
    expect(input).toHaveValue("06 12 34 56 78");
  });

  it("annonce le refus et marque le champ comme invalide", () => {
    render(
      <PhoneInput
        id="phone"
        value=""
        onChange={() => undefined}
        error="Renseignez un numéro de téléphone valide."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Renseignez un numéro de téléphone valide.",
    );
    expect(screen.getByLabelText(/téléphone/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("efface le numéro quand on le demande", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PhoneInput id="phone" value="" onChange={onChange} />);

    const input = screen.getByLabelText(/téléphone/i);
    await user.type(input, "699000001");
    await user.click(screen.getByRole("button", { name: /effacer le numéro/i }));

    expect(onChange).toHaveBeenLastCalledWith("");
    expect(input).toHaveValue("");
  });
});
