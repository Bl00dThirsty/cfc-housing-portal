import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-cfc-brown">
          <FileQuestion className="size-6" />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-cfc-brown">
          Erreur 404
        </p>
        <h1 className="mt-1 text-lg font-bold text-slate-900">Page introuvable</h1>
        <p className="mt-2 text-xs text-slate-500">
          La page demandée n&apos;existe pas, a été déplacée ou n&apos;est plus
          accessible. Revenez à l&apos;accueil du Crédit Foncier du Cameroun ou
          contactez votre conseiller.
        </p>

        <Button variant="cfc" asChild className="mt-6">
          <Link href="/">
            <Home className="size-4" />
            Retour à l&apos;accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
