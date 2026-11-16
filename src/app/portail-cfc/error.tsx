"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CFC] Erreur console d'administration :", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-xl border border-border/40 bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>

        <h1 className="text-base font-semibold text-foreground">
          Incident sur la console CFC
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Le chargement de cet écran a échoué. Vos saisies en cours ne sont pas
          enregistrées : relancez le traitement pour reprendre là où vous vous êtes
          arrêté.
        </p>

        {error.digest ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            Référence d&apos;incident : {error.digest}
          </p>
        ) : null}

        <Button onClick={() => reset()} className="mt-6 gap-1.5 text-xs">
          <RefreshCw className="size-3.5" />
          Relancer le chargement
        </Button>
      </div>
    </div>
  );
}
