import "server-only";

/**
 * La mesure des indicateurs d'un pôle.
 *
 * Toutes les lectures se font par le client **authentifié** : c'est la RLS
 * qui restreint les lignes au périmètre de l'agent (son agence, son
 * portefeuille, ses dossiers diaspora). L'application ne redéfinit pas le
 * périmètre — elle n'en fait qu'un seul, avec la base.
 *
 * Deux périodes sont comparées :
 *
 * - la **période courante** — les trente derniers jours ;
 * - la **période précédente** — les trente jours d'avant.
 *
 * Un indicateur d'**état** (un dossier ouvert) se compare au début de la
 * période ; un indicateur de **flux** (un dossier activé) se compare à la
 * période précédente.
 */

import { createServerSupabaseClient } from "@/server/supabase/server";
import { kpisForPole, type KpiId } from "@/domain/entities/kpi";
import type { PoleCode } from "@/domain/policies/capabilities";

/** Une mesure et sa valeur de comparaison. */
export interface KpiMeasure {
  current: number;
  previous: number;
}

export type PoleKpiMeasures = Partial<Record<KpiId, KpiMeasure>>;

const WINDOW_DAYS = 30;

/** Les bornes des deux périodes comparées. */
function periods(now: Date) {
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 86_400_000);
  const previousStart = new Date(now.getTime() - 2 * WINDOW_DAYS * 86_400_000);

  return {
    currentFrom: windowStart.toISOString(),
    previousFrom: previousStart.toISOString(),
    /** Borne haute de la période précédente. */
    previousTo: windowStart.toISOString(),
  };
}

/** Les états du parcours qui attendent encore une décision. */
const PENDING_ONBOARDING_STATES = ["suspension", "en_examen", "documents"];

/** Les états KYC qui ne sont pas encore statués. */
const KYC_PENDING_STATES = [
  "pre_boarding",
  "identity_capture",
  "document_verification",
  "screening_pending",
  "screening_cleared",
  "screening_potential_match",
  "enhanced_due_diligence",
  "risk_rated",
  "approval_pending",
];

/** Extrait le compte d'une requête de comptage. */
function countOf(result: { count: number | null; error: { message: string } | null }): number {
  if (result.error) {
    console.error("[kpi] comptement impossible :", result.error.message);
    return 0;
  }
  return result.count ?? 0;
}

/**
 * Mesure un indicateur.
 *
 * Chaque mesure est explicitement écrite : une mesure générique sur des
 * tables dynamiques serait plus courte, mais elle ne dirait pas **ce qui** est
 * compté — et c'est précisément ce qu'un indicateur doit dire.
 */
export async function loadPoleKpis(pole: PoleCode): Promise<PoleKpiMeasures> {
  const definitions = kpisForPole(pole);
  if (definitions.length === 0) return {};

  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const { currentFrom, previousFrom, previousTo } = periods(now);

  const measures = await Promise.all(
    definitions.map((definition) =>
      measure(supabase, definition.id, { currentFrom, previousFrom, previousTo }),
    ),
  );

  const result: PoleKpiMeasures = {};
  definitions.forEach((definition, index) => {
    result[definition.id] = measures[index];
  });

  return result;
}

/** Mesure un indicateur, selon son identifiant. */
async function measure(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  id: KpiId,
  window: { currentFrom: string; previousFrom: string; previousTo: string },
): Promise<KpiMeasure> {
  const { currentFrom, previousFrom, previousTo } = window;

  switch (id) {
    // --- Dossiers -----------------------------------------------------------

    case "dossiers_open": {
      const current = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
      );
      const previous = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .lt("created_at", currentFrom),
      );
      return { current, previous };
    }

    case "dossiers_pending": {
      const current = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .in("onboarding_state", PENDING_ONBOARDING_STATES),
      );
      const previous = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .in("onboarding_state", PENDING_ONBOARDING_STATES)
          .lt("created_at", currentFrom),
      );
      return { current, previous };
    }

    case "dossiers_activated": {
      const current = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("duc_activated_at", currentFrom),
      );
      const previous = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("duc_activated_at", previousFrom)
          .lt("duc_activated_at", previousTo),
      );
      return { current, previous };
    }

    case "activation_rate": {
      const [activated, open] = await Promise.all([
        supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .not("duc_activated_at", "is", null),
        supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
      ]);

      const openCount = countOf(open);
      const activatedCount = countOf(activated);

      const [activatedBefore, openBefore] = await Promise.all([
        supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .not("duc_activated_at", "is", null)
          .lt("duc_activated_at", currentFrom),
        supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .lt("created_at", currentFrom),
      ]);

      const openBeforeCount = countOf(openBefore);
      const activatedBeforeCount = countOf(activatedBefore);

      return {
        current:
          openCount === 0 ? 0 : Math.round((activatedCount / openCount) * 1000) / 10,
        previous:
          openBeforeCount === 0
            ? 0
            : Math.round((activatedBeforeCount / openBeforeCount) * 1000) / 10,
      };
    }

    case "dossiers_in_expertise": {
      const current = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("current_phase", "risk_bet"),
      );
      const previous = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("current_phase", "risk_bet")
          .lt("created_at", currentFrom),
      );
      return { current, previous };
    }

    // --- Identité -----------------------------------------------------------

    case "kyc_to_validate": {
      const current = countOf(
        await supabase
          .from("citizen_profiles")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .in("kyc_state", KYC_PENDING_STATES),
      );
      const previous = countOf(
        await supabase
          .from("citizen_profiles")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .in("kyc_state", KYC_PENDING_STATES)
          .lt("created_at", currentFrom),
      );
      return { current, previous };
    }

    case "risk_rated": {
      const current = countOf(
        await supabase
          .from("citizen_profiles")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .not("risk_rating", "is", null),
      );
      const previous = countOf(
        await supabase
          .from("citizen_profiles")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .not("risk_rating", "is", null)
          .lt("created_at", currentFrom),
      );
      return { current, previous };
    }

    // --- Pièces -------------------------------------------------------------

    case "documents_pending": {
      const current = countOf(
        await supabase
          .from("dossier_documents")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .in("status", ["uploaded", "under_review"]),
      );
      const previous = countOf(
        await supabase
          .from("dossier_documents")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .in("status", ["uploaded", "under_review"])
          .lt("uploaded_at", currentFrom),
      );
      return { current, previous };
    }

    case "documents_validated": {
      const current = countOf(
        await supabase
          .from("dossier_documents")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "validated")
          .gte("validated_at", currentFrom),
      );
      const previous = countOf(
        await supabase
          .from("dossier_documents")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "validated")
          .gte("validated_at", previousFrom)
          .lt("validated_at", previousTo),
      );
      return { current, previous };
    }

    // --- Comités ------------------------------------------------------------

    case "committee_deliberations": {
      const current = countOf(
        await supabase
          .from("committee_deliberations")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", currentFrom),
      );
      const previous = countOf(
        await supabase
          .from("committee_deliberations")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", previousFrom)
          .lt("created_at", previousTo),
      );
      return { current, previous };
    }

    case "committee_approval_rate": {
      const { data, error } = await supabase.rpc("kpi_committee_approval_rate");
      if (error) {
        console.error("[kpi] taux d'accord indisponible :", error.message);
        return { current: 0, previous: 0 };
      }
      return { current: Number(data ?? 0), previous: Number(data ?? 0) };
    }

    case "loan_offers": {
      const current = countOf(
        await supabase
          .from("loan_offers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", currentFrom),
      );
      const previous = countOf(
        await supabase
          .from("loan_offers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", previousFrom)
          .lt("created_at", previousTo),
      );
      return { current, previous };
    }

    // --- Notariat -----------------------------------------------------------

    case "notary_instruments": {
      const current = countOf(
        await supabase
          .from("notary_instruments")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", currentFrom),
      );
      const previous = countOf(
        await supabase
          .from("notary_instruments")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", previousFrom)
          .lt("created_at", previousTo),
      );
      return { current, previous };
    }

    case "land_titles": {
      const current = countOf(
        await supabase
          .from("land_titles")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
      );
      const previous = countOf(
        await supabase
          .from("land_titles")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .lt("created_at", currentFrom),
      );
      return { current, previous };
    }

    case "oppositions": {
      const current = countOf(
        await supabase
          .from("oppositions")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
      );
      const previous = countOf(
        await supabase
          .from("oppositions")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .lt("created_at", currentFrom),
      );
      return { current, previous };
    }

    // --- Diaspora ------------------------------------------------------------

    case "diaspora_files": {
      const current = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("is_diaspora", true),
      );
      const previous = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("is_diaspora", true)
          .lt("created_at", currentFrom),
      );
      return { current, previous };
    }

    case "diaspora_activated": {
      const current = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("is_diaspora", true)
          .gte("duc_activated_at", currentFrom),
      );
      const previous = countOf(
        await supabase
          .from("dossiers")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("is_diaspora", true)
          .gte("duc_activated_at", previousFrom)
          .lt("duc_activated_at", previousTo),
      );
      return { current, previous };
    }

    // --- Messagerie ----------------------------------------------------------

    case "emails_sent": {
      const current = countOf(
        await supabase
          .from("email_deliveries")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "sent")
          .gte("created_at", currentFrom),
      );
      const previous = countOf(
        await supabase
          .from("email_deliveries")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "sent")
          .gte("created_at", previousFrom)
          .lt("created_at", previousTo),
      );
      return { current, previous };
    }

    case "notifications_sent": {
      const current = countOf(
        await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", currentFrom),
      );
      const previous = countOf(
        await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .gte("created_at", previousFrom)
          .lt("created_at", previousTo),
      );
      return { current, previous };
    }

    // --- Épargne -------------------------------------------------------------

    case "savings_collected": {
      const { data, error } = await supabase.rpc("kpi_savings_collected");
      if (error) {
        console.error("[kpi] épargne indisponible :", error.message);
        return { current: 0, previous: 0 };
      }
      const total = Number(data ?? 0);
      return { current: total, previous: total };
    }

    default:
      return { current: 0, previous: 0 };
  }
}
