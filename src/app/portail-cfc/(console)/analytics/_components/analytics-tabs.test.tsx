import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DossiersDucTab } from "@/app/portail-cfc/(console)/analytics/_components/dossiers-duc-tab";
import { EpargnantsTab } from "@/app/portail-cfc/(console)/analytics/_components/epargnants-tab";
import { SimulationsTab } from "@/app/portail-cfc/(console)/analytics/_components/simulations-tab";
import { CanauxCollecteTab } from "@/app/portail-cfc/(console)/analytics/_components/canaux-collecte-tab";
import { TopPages } from "@/app/portail-cfc/(console)/analytics/_components/top-pages";
import SaverDetailPage from "@/app/portail-cfc/(console)/analytics/savers/[id]/page";
import SimulationDetailPage from "@/app/portail-cfc/(console)/analytics/simulations/[id]/page";
import { useDataTableStore } from "@/stores/data-table-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ id: "sav1" }),
  usePathname: () => "/portail-cfc/analytics",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  useDataTableStore.setState({ byTable: {} });
});

describe("onglets d'analytics pilotés par le moteur", () => {
  it("rend le tableau des dossiers DUC", () => {
    render(<DossiersDucTab />);

    expect(screen.getByLabelText("Rechercher")).toBeInTheDocument();
    expect(screen.getByText("CFC-2026-DUC-04750")).toBeInTheDocument();
    expect(screen.getByText("MBALLA Jean-Paul")).toBeInTheDocument();
    expect(screen.getByText("Construction Villa R+1 (Olembé)")).toBeInTheDocument();
    expect(screen.getByText("TF N° 4892/Mfoundi")).toBeInTheDocument();
    expect(screen.getByText("18 500 000 FCFA")).toBeInTheDocument();
    // L'en-tête de colonne et la facette portent le même libellé.
    expect(screen.getAllByText("Étape Actuelle (Acteur)").length).toBe(2);
  });

  it("trie le tableau des dossiers DUC sur le montant du crédit", async () => {
    const user = userEvent.setup();
    render(<DossiersDucTab />);

    await user.click(screen.getByRole("button", { name: "Trier par Montant Crédit" }));

    const rows = Array.from(document.querySelectorAll("tbody tr"));
    expect(rows[0]).toHaveTextContent("12 000 000 FCFA");
    expect(rows[4]).toHaveTextContent("25 000 000 FCFA");
  });

  it("rend le tableau des épargnants", () => {
    render(<EpargnantsTab />);

    expect(screen.getByText("CPT-EH-2024-00481")).toBeInTheDocument();
    expect(screen.getByText("ABANDA Eric")).toBeInTheDocument();
    expect(screen.getByText("Cadre Bancaire (Secteur Privé)")).toBeInTheDocument();
    expect(screen.getAllByText("4 800 000 FCFA").length).toBeGreaterThan(0);
    expect(screen.getByText("N° Compte Carthago")).toBeInTheDocument();
  });

  it("rend le tableau des simulations", () => {
    render(<SimulationsTab />);

    expect(screen.getByText("SIM-CFC-2026-0812")).toBeInTheDocument();
    expect(screen.getByText("ABANDA Eric")).toBeInTheDocument();
    expect(screen.getByText("4 800 000 FCFA (26%)")).toBeInTheDocument();
    expect(screen.getByText("15.9%")).toBeInTheDocument();
    expect(screen.getByText("Mensualité Estimée")).toBeInTheDocument();
  });

  it("rend le tableau des canaux de collecte", () => {
    render(<CanauxCollecteTab />);

    expect(screen.getByText("TX-MOMO-2026-09-0891")).toBeInTheDocument();
    expect(screen.getAllByText("MTN MoMo").length).toBeGreaterThan(0);
    expect(screen.getByText("CFC-2026-DUC-04829")).toBeInTheDocument();
    expect(screen.getByText("250 000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("Horodatage")).toBeInTheDocument();
  });

  it("rend le tableau des pages clés", () => {
    render(<TopPages />);

    expect(screen.getByText("Route / Page")).toBeInTheDocument();
    expect(screen.getByText("/simulator (Simulateur d'Emprunt)")).toBeInTheDocument();
    expect(screen.getByText("148.2k")).toBeInTheDocument();
    expect(screen.getByText("3m 45s")).toBeInTheDocument();
  });

  it("rend l'historique des versements du dossier d'épargne", () => {
    render(<SaverDetailPage />);

    expect(screen.getByText("Historique des Versements (Compte Carthago)")).toBeInTheDocument();
    expect(screen.getByText("TX-MOMO-84912")).toBeInTheDocument();
    expect(screen.getAllByText("08 Septembre 2026").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+ 250 000 FCFA").length).toBe(6);
    expect(screen.getByText("Solde Cumulé")).toBeInTheDocument();
  });

  it("rend l'échéancier d'amortissement de la simulation", () => {
    render(<SimulationDetailPage />);

    expect(screen.getByText("Année 1 (Différé Travaux)")).toBeInTheDocument();
    expect(screen.getByText("Année 20 (Dernière Échéance)")).toBeInTheDocument();
    expect(screen.getByText("69 375 FCFA")).toBeInTheDocument();
    expect(screen.getByText("Capital Restant Dû")).toBeInTheDocument();
  });

  it("trie l'échéancier d'amortissement par numéro d'année", async () => {
    const user = userEvent.setup();
    render(<SimulationDetailPage />);

    await user.click(
      screen.getByRole("button", { name: "Trier par Période / Année" }),
    );

    const rows = Array.from(document.querySelectorAll("tbody tr"));
    expect(rows[0]).toHaveTextContent("Année 1 (Différé Travaux)");
    expect(rows[5]).toHaveTextContent("Année 20 (Dernière Échéance)");
  });
});
