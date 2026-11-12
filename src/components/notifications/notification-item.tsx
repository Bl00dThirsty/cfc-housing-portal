"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/server/actions/notifications";

/** Libellé métier d'un type de notification. */
const TYPE_LABELS: Record<string, string> = {
  "kyc.decision": "Décision KYC",
  "document.requested": "Pièce demandée",
  "document.validated": "Pièce validée",
  "committee.decision": "Décision du comité",
  "loan.offer": "Offre de prêt",
  "disbursement.released": "Déblocage",
  "payoff.statement": "Décompte d'apurement",
  "mainlevee.ready": "Mainlevée",
  "support.message": "Message",
  "dossier.updated": "Dossier mis à jour",
};

type NotificationItemProps = {
  notification: NotificationRow;
  unread: boolean;
  onSelect: () => void;
};

/**
 * Une ligne de notification.
 *
 * L'anneau de gauche rappelle le dossier concerné ; le corps porte le titre,
 * le détail et l'horodatage. La pastille de droite signale l'état non lu.
 */
export function NotificationItem({
  notification,
  unread,
  onSelect,
}: NotificationItemProps) {
  const label = TYPE_LABELS[notification.type] ?? notification.type;

  return (
    <li className="relative">
      <Button
        variant="item"
        size="none"
        onClick={onSelect}
        data-unread={unread}
        className="p-3 data-[unread=true]:bg-muted/40 data-[unread=true]:hover:bg-muted/60"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-muted",
          )}
        >
          <span className="caption-style text-soft">
            {notification.dossier_id ? "DUC" : label.slice(0, 1)}
          </span>
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1 pr-4">
          <span className="block text-xs text-soft">
            <span className="font-medium text-foreground">{label}</span>{" "}
            {notification.title}
          </span>

          {notification.body && (
            <span className="block rounded-lg border border-line-strong bg-muted/40 px-3 py-2 text-xs text-soft">
              {notification.body}
            </span>
          )}

          <span className="caption-style flex items-center gap-1.5 text-subtle">
            {new Date(notification.created_at).toLocaleString("fr-FR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
            {notification.action_url && (
              <>
                <span aria-hidden className="size-0.5 rounded-full bg-subtle" />
                <Link
                  href={notification.action_url}
                  onClick={(event) => event.stopPropagation()}
                  className="underline-offset-2 hover:underline"
                >
                  Ouvrir
                </Link>
              </>
            )}
          </span>
        </span>

        {unread && <span className="sr-only">Non lue</span>}
      </Button>

      {unread && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-4 size-1.5 rounded-full bg-danger"
        />
      )}
    </li>
  );
}

export { Bell };
