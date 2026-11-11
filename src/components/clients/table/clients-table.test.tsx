import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ClientDetailSheet } from "@/components/clients/detail/client-detail-sheet";
import { ClientsTable } from "@/components/clients/table/clients-table";
import { ClientsToolbar } from "@/components/clients/toolbar/clients-toolbar";
import { useClientsStore } from "@/stores/clients-store";

import type { ClientItem } from "@/domain/entities/client";

function makeClient(overrides: Partial<ClientItem> = {}): ClientItem {
  return {
    id: "cl-1",
    ducId: "CFC-2026-DUC-00001",
    name: "ABANDA Eric",
    avatarTone: "bg-amber-100 text-amber-700",
    email: "abanda.eric@cfc.cm",
    phone: "+237 6 99 00 00 01",
    region: "Centre (Yaoundé)",
    agency: "Agence Yaoundé Centre",
    profession: "Ingénieur",
    employer: "SIC",
    projectType: "Appartement",
    loanAmount: "3 600 000",
    savingsTarget: "4 500 000",
    savingsCurrent: "1 200 000",
    savingsPercent: 20,
    monthlyIncome: "850 000",
    monthlyPayment: "145 000",
    debtRatio: "17%",
    landTitle: "TF N° 12844/Mfoundi",
    durationYears: 20,
    rate: "5,5%",
    accountNumber: "CFC-EP-0001",
    notaryAssigned: "Me NDEMBA",
    betAssigned: "BET Yaoundé",
    officer: "KAMGA Pascal",
    phase: "Épargne & KYC",
    status: "Conforme",
    lastActivity: "il y a 2h",
    completionPercent: 20,
    documents: [
      { name: "CNI biométrique", category: "Identité", status: "Validé", date: "2026-01-12" },
    ],
    visas: [
      {
        stage: "Contrôle KYC",
        actor: "Guichet CFC",
        decision: "Favorable",
        date: "2026-01-15",
        comment: "Dossier complet",
      },
    ],
    ...overrides,
  };
}

const CLIENTS: ClientItem[] = [
  makeClient(),
  makeClient({
    id: "cl-2",
    ducId: "CFC-2026-DUC-00002",
    name: "TCHOUNGUI Alain",
    agency: "Agence Douala Bonanjo",
    phase: "Comités CGR/CRC",
    status: "Accordé",
    loanAmount: "12 000 000",
    savingsCurrent: "4 500 000",
    completionPercent: 55,
  }),
  makeClient({
    id: "cl-3",
    ducId: "CFC-2026-DUC-00003",
    name: "NGO NSOA Marie",
    phase: "Épargne & KYC",
    status: "Pièces Manquantes",
    loanAmount: "8 250 000",
    savingsCurrent: "900 000",
    completionPercent: 12,
  }),
];

const noop = () => undefined;

function renderWorkspace(clients: ClientItem[] = CLIENTS) {
  return render(
    <div>
      <ClientsToolbar clients={clients} />
      <ClientsTable
        clients={clients}
        selectedClientId=""
        onSelectClient={noop}
        onOpenKanban={noop}
        onOpenDuc={noop}
        onOpenEpargne={noop}
      />
      <ClientDetailSheet
        clients={clients}
        onOpenKanban={noop}
        onOpenDuc={noop}
        onOpenEpargne={noop}
      />
    </div>,
  );
}

function resetStore() {
  useClientsStore.setState({
    sortBy: "completionPercent",
    phase: "",
    agency: "",
    status: "",
    search: "",
    selectedIds: [],
    detailId: null,
    detailOpen: false,
    profileId: null,
    profileOpen: false,
    commandOpen: false,
  });
}

describe("ClientsTable", () => {
  beforeEach(resetStore);

  it("renders every column header of the grid", () => {
    renderWorkspace();
    const headers = within(screen.getByRole("table")).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent?.trim())).toEqual([
      "Emprunteur",
      "Agence",
      "Phase",
      "Statut",
      "Montant",
      "Épargne",
      "Avancement",
      "Action",
    ]);
  });

  it("renders one row per borrower", () => {
    renderWorkspace();
    expect(screen.getByText("ABANDA Eric")).toBeInTheDocument();
    expect(screen.getByText("TCHOUNGUI Alain")).toBeInTheDocument();
    expect(screen.getByText("NGO NSOA Marie")).toBeInTheDocument();
  });

  it("shows the loan amount and the completion meter", () => {
    renderWorkspace();
    expect(screen.getByText("3 600 000")).toBeInTheDocument();
    expect(screen.getByLabelText("Avancement 20 %")).toBeInTheDocument();
  });

  it("filters rows through the search field", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.type(screen.getByLabelText("Rechercher un emprunteur"), "tchoungui");

    expect(screen.queryByText("ABANDA Eric")).not.toBeInTheDocument();
    expect(screen.getByText("TCHOUNGUI Alain")).toBeInTheDocument();
  });

  it("filters rows by phase through the store", () => {
    renderWorkspace();

    act(() => useClientsStore.getState().setPhase("Comités CGR/CRC"));

    expect(screen.queryByText("ABANDA Eric")).not.toBeInTheDocument();
    expect(screen.getByText("TCHOUNGUI Alain")).toBeInTheDocument();
    expect(screen.queryByText("NGO NSOA Marie")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", () => {
    renderWorkspace();

    act(() => useClientsStore.getState().setSearch("zzzz"));

    expect(
      screen.getByText("Aucun emprunteur ne correspond aux filtres appliqués."),
    ).toBeInTheDocument();
  });

  it("offers a reset control once a filter is engaged", () => {
    renderWorkspace();

    act(() => useClientsStore.getState().setPhase("Épargne & KYC"));

    expect(screen.getByRole("button", { name: /Réinitialiser/ })).toBeInTheDocument();
  });
});

describe("ClientDetailSheet", () => {
  beforeEach(resetStore);

  it("stays closed until a row is opened", () => {
    renderWorkspace();
    expect(screen.queryByText("Situation du dossier")).not.toBeInTheDocument();
  });

  it("opens on the clicked borrower and shows the dossier facts", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: /^ABANDA Eric/ }));

    expect(await screen.findByText("Situation du dossier")).toBeInTheDocument();
    // Le DUC figure dans la ligne du tableau et dans l'en-tête du side sheet.
    expect((await screen.findAllByText("CFC-2026-DUC-00001")).length).toBeGreaterThan(0);
    expect(screen.getByText("TF N° 12844/Mfoundi")).toBeInTheDocument();
  });

  it("lists the DUC documents and the visa trail", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: /^ABANDA Eric/ }));

    expect(await screen.findByText("Pièces du DUC")).toBeInTheDocument();
    expect(screen.getByText("CNI biométrique")).toBeInTheDocument();
    expect(screen.getByText("Visas & décisions")).toBeInTheDocument();
    expect(screen.getByText("Contrôle KYC")).toBeInTheDocument();
  });
});

describe("row selection", () => {
  beforeEach(resetStore);

  it("toggles a borrower in and out of the selection", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const checkbox = screen.getByLabelText("Sélectionner ABANDA Eric");
    await user.click(checkbox);
    expect(useClientsStore.getState().selectedIds).toEqual(["cl-1"]);

    await user.click(checkbox);
    expect(useClientsStore.getState().selectedIds).toEqual([]);
  });

  it("selects every visible borrower from the header checkbox", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByLabelText("Tout sélectionner"));

    expect(useClientsStore.getState().selectedIds).toHaveLength(3);
    expect(useClientsStore.getState().selectedIds).toEqual(
      expect.arrayContaining(["cl-1", "cl-2", "cl-3"]),
    );
  });
});
