import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";
import { NotaireCadastreActorPage } from "./notaire-console";

export const dynamic = "force-dynamic";

/**
 * L'écran du pôle.
 *
 * La page est un composant **serveur** : elle mesure les indicateurs dans le
 * périmètre de l'agent et les passe à l'écran, qui est un composant client.
 */
export default function Page() {
  return <NotaireCadastreActorPage kpi={<PoleKpiStrip />} />;
}
