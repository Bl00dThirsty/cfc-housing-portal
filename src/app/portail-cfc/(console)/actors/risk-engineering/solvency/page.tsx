import { DossierQueuePage } from "@/server/queries/dossier-workspace";

export const dynamic = "force-dynamic";

export default async function Page() {
  const queue = await DossierQueuePage({
    title: "Analyse de solvabilité — dossiers en instruction",
    description: "Dossiers actuellement en phase Risques & BET. Cette file ne révèle pas les revenus ou le profil du client; l’évaluation financière nécessite un registre de décision persisté.",
    phaseCodes: ["risk_bet"],
  });
  return <div className="flex flex-col gap-5">{queue}</div>;
}
