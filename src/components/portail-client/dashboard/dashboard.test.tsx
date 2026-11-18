import { beforeAll, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { KpiBand } from "@/components/portail-client/dashboard/kpi-band";
import { ActivityChart } from "@/components/portail-client/dashboard/activity-chart";
import { DocumentsDonut } from "@/components/portail-client/dashboard/documents-chart";
import { StagesChart } from "@/components/portail-client/dashboard/stages-chart";
import { buildDashboardModel } from "@/components/portail-client/dashboard/dashboard-model";
import { ChartTooltipContent } from "@/components/ui/chart";

import type { ChecklistItem } from "@/domain/entities/services";
import type { DossierEvent } from "@/domain/entities/processes";

beforeAll(() => {
  class ResizeObserverStub {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [
          {
            target,
            contentRect: { width: 320, height: 196, top: 0, left: 0, bottom: 196, right: 320 },
          } as unknown as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
  (globalThis as unknown as { ResizeObserverEntry: unknown }).ResizeObserverEntry = class {};
  Element.prototype.getBoundingClientRect = function () {
    return { width: 320, height: 196, top: 0, left: 0, bottom: 196, right: 320, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  };
});

function item(overrides: Partial<ChecklistItem>): ChecklistItem {
  return {
    docTypeCode: "CNI",
    documentId: null,
    label: "CNI biométrique",
    natureLabel: "Identification",
    issuingAuthority: null,
    required: true,
    stage: "ONBOARDING",
    stageLabel: "ONBOARDING",
    status: "missing",
    uploadedAt: null,
    ...overrides,
  };
}

function event(overrides: Partial<DossierEvent>): DossierEvent {
  return {
    id: "e1",
    event_type: "DOCUMENT_UPLOADED",
    actor_role: "CITIZEN",
    payload: {},
    legal_basis: null,
    occurred_at: "2026-03-04T10:00:00.000Z",
    ...overrides,
  };
}

/** `Intl` sépare les milliers par une espace insécable fine. */
function normalize(value: string): string {
  return value.replace(/\u202f|\u00a0/g, " ");
}

const fullInput = {  completionPercent: 42,
  currentPhase: "kyc_savings",
  currentPhaseLabel: "Instruction du dossier",
  checklist: [
    item({ status: "verified" }),
    item({ docTypeCode: "X", status: "uploaded", stage: "SAVINGS" }),
    item({ docTypeCode: "Y", status: "in_review", stage: "SAVINGS" }),
    item({ docTypeCode: "Z", status: "missing", stage: "CREDIT_FILE" }),
  ],
  events: [
    event({ id: "e1", occurred_at: "2026-01-12T10:00:00.000Z" }),
    event({ id: "e2", occurred_at: "2026-02-02T10:00:00.000Z" }),
    event({ id: "e3", occurred_at: "2026-03-04T10:00:00.000Z" }),
  ],
  finance: {
    loanAmount: 12_000_000,
    rate: 3.5,
    durationYears: 20,
    monthlyPayment: 145_000,
    savingsTarget: 4_500_000,
    savingsCurrent: 1_200_000,
    savingsPercent: 26.7,
    debtRatio: 17,
  },
};

const emptyInput = {
  completionPercent: null,
  currentPhase: null,
  currentPhaseLabel: null,
  checklist: [],
  events: [],
  finance: {
    loanAmount: null,
    rate: null,
    durationYears: null,
    monthlyPayment: null,
    savingsTarget: null,
    savingsCurrent: null,
    savingsPercent: null,
    debtRatio: null,
  },
};

describe("modèle du tableau de bord", () => {
  it("produit quatre indicateurs lisibles, sans valeur vide", () => {
    const model = buildDashboardModel(fullInput);
    expect(model.kpis).toHaveLength(4);
    for (const kpi of model.kpis) {
      expect(kpi.value).not.toMatch(/NaN|undefined|null/);
      expect(kpi.unit.length).toBeGreaterThan(0);
    }
    expect(model.kpis[0].value).toBe("42");
    expect(model.kpis[0].unit).toBe("%");
    expect(model.kpis[1].value).toBe("3 / 4");
    expect(normalize(model.kpis[2].value)).toBe("1 200 000");
    expect(model.kpis[2].unit).toBe("FCFA");
    expect(model.kpis[3].label).toBe("Échéance mensuelle");
    expect(normalize(model.kpis[3].value)).toBe("145 000");
  });

  it("retombe sur le montant du prêt quand l'échéance manque", () => {
    const model = buildDashboardModel({
      ...fullInput,
      finance: { ...fullInput.finance, monthlyPayment: null },
    });
    expect(model.kpis[3].label).toBe("Montant du prêt");
    expect(normalize(model.kpis[3].value)).toBe("12 000 000");
  });

  it("traite l'absence de données sans jamais afficher NaN", () => {
    const model = buildDashboardModel(emptyInput);
    for (const kpi of model.kpis) {
      expect(kpi.value).not.toMatch(/NaN|undefined|null/);
    }
    expect(model.kpis[0].value).toBe("—");
    expect(model.kpis[0].note).toMatch(/non renseignée/i);
    expect(model.kpis[1].value).toBe("—");
    expect(model.kpis[2].value).toBe("—");
    expect(model.kpis[3].value).toBe("—");
    expect(model.documentStatus.every((slice) => slice.value === 0)).toBe(true);
    expect(model.stageProgress).toHaveLength(0);
    expect(model.monthlyActivity).toHaveLength(0);
  });

  it("agrège les pièces obligatoires par étape et les événements par mois", () => {
    const model = buildDashboardModel(fullInput);
    expect(model.stageProgress.map((stage) => stage.label)).toEqual([
      "À l'inscription",
      "Pendant l'épargne",
      "Dossier de crédit",
    ]);
    expect(model.stageProgress[0]).toMatchObject({ required: 1, provided: 1 });
    expect(model.monthlyActivity).toHaveLength(3);
    expect(model.monthlyActivity[0].count).toBe(1);
  });
});

describe("tableau de bord", () => {
  it("affiche le bandeau d'indicateurs", () => {
    const model = buildDashboardModel(fullInput);
    render(<KpiBand kpis={model.kpis} />);
    expect(screen.getByText("Avancement du dossier")).toBeTruthy();
    expect(screen.getByText("Complétude des pièces")).toBeTruthy();
    expect(screen.getByText("Épargne constituée")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("affiche l'anneau des pièces avec sa légende", () => {
    const model = buildDashboardModel(fullInput);
    const { container } = render(
      <DocumentsDonut
        status={model.documentStatus}
        completionPercent={model.completionPercent}
        piecesCompletionPercent={model.piecesCompletionPercent}
      />,
    );
    expect(screen.getByText("Pièces par état")).toBeTruthy();
    expect(screen.getByText("Validées")).toBeTruthy();
    expect(screen.getByText("À fournir")).toBeTruthy();
    expect(container.querySelector('[role="img"]')).toBeTruthy();
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toMatch(
      /Répartition des pièces/,
    );
    expect(container.querySelector(".recharts-pie-sector")).toBeTruthy();
  });

  it("affiche un état vide quand aucune pièce n'est attendue", () => {
    const model = buildDashboardModel(emptyInput);
    render(
      <DocumentsDonut
        status={model.documentStatus}
        completionPercent={model.completionPercent}
        piecesCompletionPercent={model.piecesCompletionPercent}
      />,
    );
    expect(screen.getByText(/Aucune pièce n'est attendue/)).toBeTruthy();
    expect(screen.queryByText("Validées")).toBeNull();
  });

  it("affiche le graphique des étapes", () => {
    const model = buildDashboardModel(fullInput);
    const { container } = render(<StagesChart stages={model.stageProgress} />);
    expect(screen.getByText("Pièces par étape")).toBeTruthy();
    expect(screen.getByText("Pièces attendues")).toBeTruthy();
    expect(container.querySelector(".recharts-bar-rectangle")).toBeTruthy();
  });

  it("affiche le graphique d'activité", () => {
    const model = buildDashboardModel(fullInput);
    const { container } = render(<ActivityChart activity={model.monthlyActivity} />);
    expect(screen.getByText("Activité du dossier")).toBeTruthy();
    expect(container.querySelector(".recharts-bar-rectangle")).toBeTruthy();
  });

  it("affiche un état vide quand le dossier n'a aucun événement", () => {
    const model = buildDashboardModel(emptyInput);
    render(<ActivityChart activity={model.monthlyActivity} />);
    expect(screen.getByText(/Aucun événement enregistré/)).toBeTruthy();
  });

  it("résout le libellé et l'unité d'une part d'anneau dans l'infobulle", () => {
    const config = {
      verified: { label: "Validées", color: "var(--chart-verified)", unit: "pièces" },
    };
    const { container } = render(
      <ChartTooltipContent
        config={config}
        active
        payload={[{ dataKey: "value", name: "verified", value: 3, color: "var(--chart-verified)" }]}
      />,
    );
    expect(container.textContent).toContain("Validées");
    expect(container.textContent).toContain("3 pièces");
  });

  it("publie les couleurs de série dans des variables CSS", () => {
    const model = buildDashboardModel(fullInput);
    const { container } = render(
      <DocumentsDonut
        status={model.documentStatus}
        completionPercent={model.completionPercent}
        piecesCompletionPercent={model.piecesCompletionPercent}
      />,
    );
    const chart = container.querySelector('[data-slot="chart"]') as HTMLElement;
    expect(chart.style.getPropertyValue("--color-verified")).toBe("var(--chart-verified)");
    expect(chart.style.height).toBe("196px");
  });
});
