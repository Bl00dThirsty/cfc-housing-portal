import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { listEmailDeliveriesAction, listEmailTemplatesAction } from "@/server/email/actions";

import {
  EmailTemplatesTable,
  type EmailTemplateCatalogueRow,
} from "./_components/email-templates-table";

export const dynamic = "force-dynamic";

/**
 * Catalogue des modèles d'e-mail.
 *
 * Une ligne par code : l'intitulé, le public visé, l'état, la version
 * courante et le nombre d'envois constatés. L'édition passe par la page du
 * modèle, qui publie une **version nouvelle**.
 */
export default async function EmailTemplatesPage() {
  const [templates, deliveries] = await Promise.all([
    listEmailTemplatesAction(),
    listEmailDeliveriesAction({ limit: 500 }),
  ]);

  const sentCount = new Map<string, number>();
  for (const delivery of deliveries) {
    sentCount.set(delivery.template_code, (sentCount.get(delivery.template_code) ?? 0) + 1);
  }

  /**
   * Les lignes du catalogue.
   *
   * Seules des données **sérialisables** franchissent la frontière
   * serveur/client : le tableau est rendu par un composant client, qui
   * porte ses propres colonnes.
   */
  const rows: EmailTemplateCatalogueRow[] = templates.map((template) => ({
    code: template.code,
    label: template.label,
    audience: template.audience,
    isActive: template.isActive,
    version: template.version,
    effectiveFrom: template.effectiveFrom,
    sentCount: sentCount.get(template.code) ?? 0,
  }));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-sm font-semibold text-foreground">Modèles d&apos;e-mail</h1>
          <p className="text-xs text-muted-foreground">
            Catalogue déclarable des notifications envoyées aux citoyens et aux agents. Chaque
            modification ouvre une version nouvelle : les modèles expédiés ne sont jamais
            réécrits.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/portail-cfc/settings/email/deliveries">Journal des envois</Link>
        </Button>
      </header>

      <EmailTemplatesTable rows={rows} />
    </div>
  );
}
