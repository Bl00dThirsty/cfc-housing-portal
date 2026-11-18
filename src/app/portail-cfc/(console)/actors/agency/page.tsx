import { DossierQueuePage } from "@/server/queries/dossier-workspace";
import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";

export const dynamic = "force-dynamic";

export default async function Page() {
  const queue = await DossierQueuePage({
    title: "Enrôlement & épargne habitat",
    description: "Dossiers enregistrés à l’étape d’entrée en relation, dans le périmètre autorisé de votre compte.",
    phaseCodes: ["kyc_savings"],
  });
  return <div className="flex flex-col gap-5"><PoleKpiStrip />{queue}</div>;
}
