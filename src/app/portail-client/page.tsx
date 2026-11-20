import { redirect } from "next/navigation";

import { CitizenRequestWorkspace } from "@/components/portail-client/citizen-request-workspace";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { getCitizenSpace } from "@/server/queries/citizen-space";

export const dynamic = "force-dynamic";

/** Default borrower home: the most recently updated request. */
export default async function CitizenPortalPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [spaceResult, profileResult] = await Promise.all([
    getCitizenSpace(user.id),
    supabase.from("citizen_profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (!spaceResult.ok) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-sm text-destructive">Espace citoyen illisible : {spaceResult.error}</p>
      </div>
    );
  }

  if (!spaceResult.space) redirect("/portail-client/demandes");

  const displayName = profileResult.data?.full_name ?? user.email ?? "Emprunteur";
  return <CitizenRequestWorkspace space={spaceResult.space} displayName={displayName} />;
}
