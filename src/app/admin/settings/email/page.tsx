import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listEmailDeliveriesAction, listEmailTemplatesAction } from "@/server/email/actions";

export const dynamic = "force-dynamic";

const AUDIENCE_LABELS: Record<string, string> = {
  citizen: "Citoyen",
  staff: "Agent",
  both: "Citoyen & Agent",
};

/** Formate une date ISO en français. */
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

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
          <Link href="/admin/settings/email/deliveries">Journal des envois</Link>
        </Button>
      </header>

      <Card size="sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Intitulé</TableHead>
              <TableHead>Public</TableHead>
              <TableHead>État</TableHead>
              <TableHead className="text-right">Version</TableHead>
              <TableHead className="text-right">Envois</TableHead>
              <TableHead className="text-right">En vigueur depuis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.code}>
                <TableCell>
                  <Link
                    href={`/admin/settings/email/${template.code}`}
                    className="font-mono text-[12px] font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {template.code}
                  </Link>
                </TableCell>
                <TableCell className="text-[13px] text-foreground">{template.label}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[11px]">
                    {AUDIENCE_LABELS[template.audience] ?? template.audience}
                  </Badge>
                </TableCell>
                <TableCell>
                  {template.isActive ? (
                    <Badge variant="success" className="text-[11px]">
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[11px]">
                      Désactivé
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-[12px] text-muted-foreground">
                  v{template.version}
                </TableCell>
                <TableCell className="text-right text-[12px] text-muted-foreground">
                  {sentCount.get(template.code) ?? 0}
                </TableCell>
                <TableCell className="text-right text-[12px] text-muted-foreground">
                  {formatDate(template.effectiveFrom)}
                </TableCell>
              </TableRow>
            ))}

            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                  Aucun modèle dans le catalogue. Lancez le seed de la base pour le peupler.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
