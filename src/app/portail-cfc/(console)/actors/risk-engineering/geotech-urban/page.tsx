import { DossierQueuePage } from "@/server/queries/dossier-workspace";

export const dynamic = "force-dynamic";

export default async function Page() {
  const queue = await DossierQueuePage({
    title: "Expertise géotechnique & urbaine — dossiers",
    description: "Références des dossiers DUC en phase Risques & BET. Les mesures, avis techniques et pièces de visite ne sont pas simulés.",
    phaseCodes: ["risk_bet"],
  });
  return <div className="flex flex-col gap-5">{queue}</div>;
}
