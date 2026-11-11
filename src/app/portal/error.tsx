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
    console.error("[CFC] Erreur portail guichet unique :", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-cfc-brown">
          <AlertTriangle className="size-6" />
        </div>

        <h1 className="text-lg font-bold text-slate-900">
          Votre dossier n&apos;a pas pu être affiché
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Le guichet unique n&apos;a pas pu récupérer les pièces de votre Dossier
          Unique Client. Vos dépôts déjà versés sont conservés : relancez le
          chargement pour reprendre votre constitution de dossier.
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
