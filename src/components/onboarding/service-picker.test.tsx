import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ServicePicker } from "@/components/onboarding/service-picker";
import type { ServiceSummary } from "@/domain/entities/services";

/**
 * Le choix du service — la fenêtre à trois choix.
 *
 * Ce que le test protège : la réponse du demandeur **décide** de la suite.
 * Une fenêtre qui ne proposerait pas les trois situations, ou qui les
 * proposerait dans le désordre, ferait perdre au demandeur son dossier.
 */

const services: ServiceSummary[] = [
  {
    code: "PRET_FONCIER_CLASSIQUE_JEUNE",
    label: "Prêt Foncier Classique — Jeune",
    description: "Pour les jeunes de moins de 35 ans.",
    audience: "Jeunes de moins de 35 ans",
    products: [
      {
        code: "PFC_JEUNE_15",
        label: "Prêt Foncier Classique Jeune — 15 ans",
        loanCeiling: null,
        minApportPercent: 10,
        maxDurationYears: 15,
        indicativeRate: 5,
        savingsRate: 3.5,
      },
    ],
    documents: [
      {
        docTypeCode: "CNI_BIOMETRIQUE",
        label: "Carte Nationale d'Identité biométrique",
        natureCode: "IDENTITE",
        natureLabel: "Identité",
        issuingAuthority: "DGSN",
        category: "emprunteur",
        required: true,
        minCount: 1,
        stage: "ONBOARDING",
      },
    ],
  },
];

const actions = vi.hoisted(() => ({
  saveService: vi.fn(),
  setPriorClientCase: vi.fn(),
}));

vi.mock("@/server/actions/borrower-requests", () => ({
  saveServiceAction: actions.saveService,
  setPriorClientCaseAction: actions.setPriorClientCase,
}));

describe("le choix du service", () => {
  beforeEach(() => {
    actions.saveService.mockReset();
    actions.setPriorClientCase.mockReset();
    actions.saveService.mockResolvedValue({ ok: true, dossierCode: "CFC-2026-DUC-00001" });
    actions.setPriorClientCase.mockResolvedValue({ ok: true, advisor: "Mme Mbezele" });
  });

  it("montre la carte lue du catalogue : audience, taux, apport, pièces", () => {
    render(
      <ServicePicker
        services={services}
        dossierId="00000000-0000-4000-8000-000000000001"
        onSuspended={() => {}}
        onNext={() => {}}
        saving={false}
        setSaving={() => {}}
      />,
    );

    expect(screen.getByText("Prêt Foncier Classique — Jeune")).toBeInTheDocument();
    expect(screen.getByText("Jeunes de moins de 35 ans")).toBeInTheDocument();
    expect(screen.getByText("5 % / an")).toBeInTheDocument();
    expect(screen.getByText("Apport 10 %")).toBeInTheDocument();
    expect(screen.getByText("1 pièce requise")).toBeInTheDocument();
  });

  it("ouvre la fenêtre à trois situations", async () => {
    const user = userEvent.setup();

    render(
      <ServicePicker
        services={services}
        dossierId="00000000-0000-4000-8000-000000000001"
        onSuspended={() => {}}
        onNext={() => {}}
        saving={false}
        setSaving={() => {}}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /Prêt Foncier Classique/ }));

    expect(await screen.findByText(/où vous en êtes/)).toBeInTheDocument();
    expect(
      screen.getByText("C'est la première fois que j'ai affaire au CFC."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("J'ai déjà bénéficié de ce type de service, mais pas au CFC."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("J'ai déjà bénéficié de ce service au CFC."),
    ).toBeInTheDocument();
  });

  it("passe au dépôt des pièces quand le demandeur a déjà été servi au CFC", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(
      <ServicePicker
        services={services}
        dossierId="00000000-0000-4000-8000-000000000001"
        onSuspended={() => {}}
        onNext={onNext}
        saving={false}
        setSaving={() => {}}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /Prêt Foncier Classique/ }));
    await user.click(
      await screen.findByText("J'ai déjà bénéficié de ce service au CFC."),
    );

    expect(actions.setPriorClientCase).toHaveBeenCalledWith({
      priorClientCase: "deja_au_cfc",
      dossierId: "00000000-0000-4000-8000-000000000001",
    });
    expect(onNext).toHaveBeenCalled();
  });

  it("nomme le conseiller et suspend le dossier quand le demandeur n'est pas encore client", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(
      <ServicePicker
        services={services}
        dossierId="00000000-0000-4000-8000-000000000001"
        onSuspended={() => {}}
        onNext={onNext}
        saving={false}
        setSaving={() => {}}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /Prêt Foncier Classique/ }));
    await user.click(
      await screen.findByText("C'est la première fois que j'ai affaire au CFC."),
    );

    expect(actions.setPriorClientCase).toHaveBeenCalledWith({
      priorClientCase: "premiere_fois",
      dossierId: "00000000-0000-4000-8000-000000000001",
    });
    expect(onNext).not.toHaveBeenCalled();

    // La seconde fenêtre explique l'attente et nomme le conseiller.
    expect(await screen.findByText(/depuis au moins/)).toBeInTheDocument();
    expect(screen.getByText("Mme Mbezele")).toBeInTheDocument();
  });
});
