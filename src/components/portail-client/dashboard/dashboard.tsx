import { ActivityChart } from "@/components/portail-client/dashboard/activity-chart";
import { DocumentsDonut } from "@/components/portail-client/dashboard/documents-chart";
import { KpiBand } from "@/components/portail-client/dashboard/kpi-band";
import { StagesChart } from "@/components/portail-client/dashboard/stages-chart";
import type { DashboardModel } from "@/components/portail-client/dashboard/dashboard-model";

/**
 * Tableau de bord de l'emprunteur.
 *
 * Le bandeau d'indicateurs et les trois graphiques répondent à une seule
 * question : « où en est mon dossier ? ». La chronologie, les pièces et les
 * messages restent en dessous : le tableau de bord donne la mesure, le reste
 * donne le détail.
 */
export function CitizenDashboard({ model }: { model: DashboardModel }) {
  return (
    <section aria-label="Tableau de bord du dossier" className="flex flex-col gap-4">
      <KpiBand kpis={model.kpis} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DocumentsDonut
          status={model.documentStatus}
          completionPercent={model.completionPercent}
          piecesCompletionPercent={model.piecesCompletionPercent}
        />
        <StagesChart stages={model.stageProgress} />
        <div className="md:col-span-2 xl:col-span-1">
          <ActivityChart activity={model.monthlyActivity} />
        </div>
      </div>
    </section>
  );
}
