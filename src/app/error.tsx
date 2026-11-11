"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CFC] Erreur non interceptée :", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-cfc-brown">
          <AlertTriangle className="size-6" />
        </div>

        <h1 className="text-lg font-bold text-slate-900">Une erreur est survenue</h1>
        <p className="mt-2 text-xs text-slate-500">
          Le guichet numérique du Crédit Foncier du Cameroun a rencontré un incident
          inattendu. Aucune donnée n&apos;a été perdue : vous pouvez relancer le
          traitement.
        </p>

        {error.digest ? (
          <p className="mt-2 font-mono text-[11px] text-slate-400">
            Référence d&apos;incident : {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="cfc" onClick={() => reset()}>
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="size-4" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
