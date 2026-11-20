import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_KYC_PROFILE } from "@/domain/entities/kyc-profile";
import { KycIdentityStep } from "./kyc-identity";

describe("KycIdentityStep", () => {
  it("renders and stores option codes supplied by the database catalogue", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <KycIdentityStep
        identity={EMPTY_KYC_PROFILE.identity}
        familyStatusOptions={[
          { code: "civil_union", label: "Union civile", sortOrder: 10 },
        ]}
        idDocumentTypeOptions={[
          { code: "regional_identity_card", label: "Carte régionale", sortOrder: 10 },
        ]}
        onChange={onChange}
        errors={{}}
      />,
    );

    const [familyStatus, idDocumentType] = screen.getAllByRole("combobox");

    await user.click(familyStatus!);
    await user.click(screen.getByRole("option", { name: "Union civile" }));
    expect(onChange).toHaveBeenCalledWith({ familyStatus: "civil_union" });

    await user.click(idDocumentType!);
    await user.click(screen.getByRole("option", { name: "Carte régionale" }));
    expect(onChange).toHaveBeenLastCalledWith({ idDocumentType: "regional_identity_card" });
  });
});
