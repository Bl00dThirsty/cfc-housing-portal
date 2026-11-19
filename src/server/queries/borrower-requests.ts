import { getPublicEnv } from "@/server/env";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { referenceView } from "@/server/queries/reference";
import {
  mapBorrowerRequestRows,
  type BorrowerRequestsResult,
  type BorrowerRequestRow,
} from "@/domain/entities/borrower-request";

/** Read every non-deleted request belonging to the authenticated citizen. */
export async function listBorrowerRequests(): Promise<BorrowerRequestsResult> {
  if (!getPublicEnv()) return { ok: true, requests: [] };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Reconnectez-vous pour consulter vos demandes." };
  }

  const { data: actor, error: actorError } = await supabase
    .from("actors")
    .select("actor_type")
    .eq("id", user.id)
    .maybeSingle();

  if (actorError || actor?.actor_type !== "citizen") {
    return { ok: false, error: "Cet espace est réservé aux emprunteurs." };
  }

  const { data, error } = await supabase
    .from("dossiers")
    .select("id, duc_code, service_code, status, onboarding_state, completion_percent, created_at, updated_at")
    .eq("citizen_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    return { ok: false, error: "Vos demandes ne peuvent pas être chargées pour le moment." };
  }

  const rows = (data ?? []) as BorrowerRequestRow[];
  if (rows.length === 0) return { ok: true, requests: [] };

  const serviceCodes = [...new Set(rows.map((row) => row.service_code).filter((code): code is string => Boolean(code)))];
  const labels = new Map<string, string>();

  if (serviceCodes.length > 0) {
    const { data: services, error: servicesError } = await supabase
      .from(referenceView("service"))
      .select("code, label")
      .in("code", serviceCodes)
      .is("deleted_at", null);

    if (servicesError) {
      return { ok: false, error: "Le catalogue des services ne peut pas être chargé." };
    }

    for (const service of services ?? []) {
      labels.set(String(service.code), String(service.label));
    }
  }

  return { ok: true, requests: mapBorrowerRequestRows(rows, labels) };
}
