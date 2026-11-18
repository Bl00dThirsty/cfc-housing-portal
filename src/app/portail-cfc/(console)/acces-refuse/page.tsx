import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { landingPathForRole } from "@/config/rbac/sidebar-by-role";
import { ROLE_LABELS } from "@/lib/auth-data";
import { getServerProfile } from "@/server/auth/profile";

export const dynamic = "force-dynamic";

/**
 * Écran de **refus d'accès** de la console CFC.
 *
 * Le middleware y renvoie l'agent dont le rôle ne porte pas l'écran demandé.
 * L'écran explique le refus au lieu d'afficher un écran vide : un agent sait
 * ainsi *pourquoi* il ne voit pas tel écran et où aller.
 */
export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ route?: string }>;
}) {
  const [profile, params] = await Promise.all([
    getServerProfile().catch(() => null),
    searchParams,
  ]);

  const requested = params.route ?? "";
  const landing = profile ? landingPathForRole(profile.role) : "/portail-cfc/clients";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-xl border border-border/40 bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-cfc-lightgold text-cfc-brown">
          <ShieldAlert className="size-6" aria-hidden />
        </div>

        <Badge variant="cfc">Contrôle d&apos;habilitation</Badge>

        <h1 className="mt-3 text-base font-semibold text-foreground">
          Cet écran ne relève pas de votre habilitation
        </h1>

        <p className="mt-2 text-xs text-muted-foreground">
          {profile
            ? `Vous êtes habilité en ${ROLE_LABELS[profile.role] ?? profile.role}. Les écrans d'un autre pôle ne sont pas ouverts à votre rôle : l'accès direct par l'adresse est refusé, comme le serait un lien direct vers un dossier hors de votre périmètre.`
            : "Votre session n'a pas pu être résolue : aucun rôle n'est associé à votre compte."}
        </p>

        {requested ? (
          <p className="mt-3 rounded-lg border border-border/40 bg-secondary px-3 py-2 font-mono text-[11px] text-subtle">
            Écran demandé : {requested}
          </p>
        ) : null}

        <Button asChild className="mt-6 text-xs">
          <Link href={landing}>Aller à mon écran</Link>
        </Button>
      </div>
    </div>
  );
}
