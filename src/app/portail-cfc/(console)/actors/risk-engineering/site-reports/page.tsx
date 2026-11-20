import { DossierQueuePage } from "@/server/queries/dossier-workspace";

export const dynamic = "force-dynamic";

export default async function Page() {
  const queue = await DossierQueuePage({
    title: "Suivi BET — dossiers",
    description: "Dossiers actuellement dans la phase Risques & BET. Aucun compte rendu de visite fictif n’est affiché.",
    phaseCodes: ["risk_bet"],
  });
  return <div className="flex flex-col gap-5">{queue}</div>;
}
