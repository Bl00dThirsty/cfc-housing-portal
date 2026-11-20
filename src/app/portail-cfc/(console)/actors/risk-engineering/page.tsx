import { DossierQueuePage } from "@/server/queries/dossier-workspace";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const queue = await DossierQueuePage({
    title: "Dossiers en phase Risques & BET",
    description: "Portefeuille DUC actuellement à l’étape d’expertise des risques. Les rapports et valeurs d’étude ne sont affichés que lorsqu’ils sont enregistrés dans leurs registres.",
    phaseCodes: ["risk_bet"],
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{queue}</div>;
}
