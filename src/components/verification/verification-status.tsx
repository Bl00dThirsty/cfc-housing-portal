import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VerificationStatus({ code }: { code?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-zinc-950">
      <section className="w-full max-w-xl space-y-5 rounded-2xl border bg-card p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <AlertTriangle className="size-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Crédit Foncier du Cameroun
          </p>
          <h1 className="text-xl font-semibold text-foreground">
            Vérification d&apos;actes indisponible
          </h1>
          {code ? (
            <p className="font-mono text-sm text-muted-foreground">Code : {code}</p>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Ce portail n&apos;est pas relié à un registre officiel des attestations.
          Il ne peut donc ni confirmer ni invalider l&apos;authenticité d&apos;un
          document. Ne vous fiez pas à cette page pour prendre une décision ;
          vérifiez directement auprès d&apos;une agence du CFC.
        </p>
        <Button asChild variant="outline">
          <Link href="/faq">Consulter l&apos;aide du portail</Link>
        </Button>
      </section>
    </main>
  );
}
