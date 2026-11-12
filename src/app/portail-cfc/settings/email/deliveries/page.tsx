import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { listEmailDeliveriesAction } from "@/server/email/actions";
import { EmailDeliveriesTable } from "../_components/email-deliveries-table";

export const dynamic = "force-dynamic";

/**
 * Journal des livraisons d'e-mail.
 *
 * Chaque ligne correspond à une tentative d'envoi : le modèle, le
 * destinataire, l'état, le fournisseur, l'éventuelle erreur et les variables
 * employées (dans la charge utile de la ligne).
 */
export default async function EmailDeliveriesPage() {
  const deliveries = await listEmailDeliveriesAction({ limit: 200 });

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-sm font-semibold text-foreground">Journal des envois</h1>
          <p className="text-xs text-muted-foreground">
            Trace des envois d&apos;e-mail : modèle, destinataire, état et fournisseur. Un envoi
            « ignoré » signifie qu&apos;aucune messagerie n&apos;est configurée ou que le modèle
            est désactivé — l&apos;opération métier, elle, n&apos;a pas été bloquée.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/settings/email">Catalogue des modèles</Link>
        </Button>
      </header>

      <EmailDeliveriesTable deliveries={deliveries} />
    </div>
  );
}
