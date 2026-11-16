import * as React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * État d'erreur — le rendu unique d'un échec.
 *
 * Une panne de lecture ne doit **jamais** se confondre avec une absence de
 * donnée : une cloche qui ne charge pas ne doit pas afficher « vous êtes à
 * jour », un fil qui ne se charge pas ne doit pas afficher « aucun message ».
 * Cet état porte le refus, la cause quand elle est connue, et la reprise.
 *
 * `role="alert"` : le message est annoncé immédiatement par les lecteurs
 * d'écran, sans dépendre du focus.
 */

export interface ErrorStateProps {
  /** Ce qui n'a pas pu être fait — en français, à l'utilisateur. */
  title: string;
  /** La cause, quand elle est connue. */
  message?: string | null;
  /** Action de reprise ; sans elle, l'état reste informatif. */
  onRetry?: () => void;
  /** Libellé de l'action de reprise. */
  retryLabel?: string;
  /** Classe CSS additionnelle. */
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Réessayer",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-6 py-8 text-center",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="size-4" aria-hidden />
      </span>

      <p className="text-[13px] font-semibold leading-tight text-danger">{title}</p>

      {message ? (
        <p className="max-w-sm text-[11.5px] leading-relaxed text-danger/90">{message}</p>
      ) : null}

      {onRetry ? (
        <Button
          type="button"
          variant="muted"
          size="sm"
          onClick={onRetry}
          className="mt-1 gap-1.5 text-[11px]"
        >
          <RotateCw className="size-3.5" aria-hidden />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default ErrorState;
