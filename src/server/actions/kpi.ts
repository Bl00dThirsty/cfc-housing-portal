"use server";

/**
 * La lecture des indicateurs du pôle de l'agent connecté.
 *
 * Le pôle est déduit du **rôle** — la relation est bijective — et les
 * mesures sont faites dans le périmètre de l'agent. Un indicateur n'est jamais
 * un nombre écrit à la main.
 */

import { getServerProfile } from "@/server/auth/profile";
import { loadPoleKpis } from "@/server/queries/pole-kpis";
import { ROLE_POLES, type StaffRole } from "@/domain/policies/capabilities";
import {
  formatKpiValue,
  kpiChange,
  kpisForPole,
} from "@/domain/entities/kpi";
import type { ActorKpiItem } from "@/components/portail-cfc/actor-kpi-strip";

export type PoleKpisResult =
  | { ok: true; items: ActorKpiItem[] }
  | { ok: false; error: string };

/**
 * Les indicateurs du pôle de l'agent, formatés pour la pastille.
 */
export async function loadPoleKpisAction(): Promise<PoleKpisResult> {
  const profile = await getServerProfile();
  if (!profile) return { ok: false, error: "Session requise." };

  const pole = ROLE_POLES[profile.role as StaffRole];
  if (!pole) {
    return { ok: false, error: "Votre rôle n'est rattaché à aucun pôle." };
  }

  const definitions = kpisForPole(pole);
  if (definitions.length === 0) {
    return { ok: false, error: "Ce pôle ne porte pas d'indicateur." };
  }

  const measures = await loadPoleKpis(pole);

  const items: ActorKpiItem[] = definitions.map((definition) => {
    const measure = measures[definition.id] ?? { current: 0, previous: 0 };
    const change = kpiChange({
      current: measure.current,
      previous: measure.previous,
      higherIsBetter: definition.higherIsBetter,
    });

    return {
      title: definition.title,
      value: formatKpiValue(definition.format, measure.current),
      change: change.label,
      isPositive: change.isPositive,
      previous: formatKpiValue(definition.format, measure.previous),
      period: definition.kind === "flow" ? "30 derniers jours" : "en cours",
    };
  });

  return { ok: true, items };
}
