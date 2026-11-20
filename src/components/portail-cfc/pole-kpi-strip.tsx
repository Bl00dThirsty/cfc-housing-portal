import { ActorKpiStrip } from "@/components/portail-cfc/actor-kpi-strip";
import { loadPoleKpisAction } from "@/server/actions/kpi";

/**
 * La pastille d'indicateurs du pôle de l'agent.
 *
 * Les chiffres sont **mesurés** : ils viennent de la base, dans le périmètre
 * de l'agent qui consulte. Rien n'est écrit à la main — un indicateur que
 * l'on ne sait pas mesurer ne doit pas être affiché.
 *
 * La mesure se fait **côté serveur** : les valeurs arrivent avec la page, et
 * l'agent ne voit jamais un indicateur vide avant qu'il se charge.
 */
export async function PoleKpiStrip() {
  const result = await loadPoleKpisAction();

  if (!result.ok) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive"
      >
        {result.error}
      </p>
    );
  }

  return <ActorKpiStrip items={result.items} />;
}
