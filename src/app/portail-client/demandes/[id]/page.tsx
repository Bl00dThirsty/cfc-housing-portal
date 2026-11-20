import { notFound, redirect } from "next/navigation";

import { CitizenRequestWorkspace } from "@/components/portail-client/citizen-request-workspace";
import { createServerSupabaseClient } from "@/server/supabase/server";
import { getCitizenSpace } from "@/server/queries/citizen-space";

export const dynamic = "force-dynamic";

export default async function BorrowerRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ etape?: string; piece?: string }>;
}) {
  const [{ id }, anchors] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [result, profile] = await Promise.all([
    getCitizenSpace(user.id, id),
    supabase.from("citizen_profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (!result.ok) {
    return <div className="mx-auto max-w-2xl px-4 py-16"><p role="alert" className="text-sm text-destructive">Cette demande est momentanément indisponible. Réessayez dans quelques instants.</p></div>;
  }
  if (!result.space) notFound();

  return (
    <CitizenRequestWorkspace
      space={result.space}
      displayName={profile.data?.full_name ?? user.email ?? "Emprunteur"}
      anchorStepCode={anchors.etape}
      anchorDocumentId={anchors.piece}
    />
  );
}
