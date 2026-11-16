"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import type { DataColumn } from "@/components/data-table/types";
import { useDataTable } from "@/components/data-table/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { TableCell, TableRow } from "@/components/ui/table";
import { resendEmailDeliveryAction } from "@/server/email/actions";
import type { EmailDeliveryRow } from "@/server/email/types";

/**
 * Journal des livraisons d'e-mail.
 *
 * Il répond à la question « le client dit ne pas avoir reçu le message » :
 * chaque tentative est tracée avec son état, son fournisseur et les
 * variables employées. Les envois en échec peuvent être rejoués depuis
 * l'écran.
 */

/** Identifiant du tableau dans le store : il isole son état. */
const TABLE_ID = "email-deliveries";

const STATUS_LABELS: Record<string, string> = {
  queued: "En file",
  sent: "Envoyé",
  failed: "Échec",
  skipped: "Ignoré",
};

const STATUS_VARIANTS: Record<string, "success" | "destructive" | "secondary" | "outline"> = {
  queued: "secondary",
  sent: "success",
  failed: "destructive",
  skipped: "outline",
};

/** Formate une date ISO en français. */
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

/**
 * Les colonnes du journal des livraisons.
 *
 * Une **constante de module** : le moteur mémoïse sur l'identité du tableau
 * des colonnes, et une écriture en ligne dans le JSX l'invaliderait à chaque
 * rendu.
 */
const EMAIL_DELIVERY_COLUMNS: DataColumn<EmailDeliveryRow>[] = [
  {
    key: "createdAt",
    label: "Date",
    // La valeur est une **date** : le moteur la trie chronologiquement. La
    // cellule, elle, s'affiche en français, avec l'heure.
    accessor: (row) => new Date(row.created_at),
    render: (row) => formatDate(row.created_at),
  },
  {
    key: "templateCode",
    label: "Modèle",
    accessor: (row) => row.template_code,
    render: (row) => (
      <span className="font-mono text-[12px] font-medium text-foreground">
        {row.template_code}
      </span>
    ),
  },
  {
    key: "recipient",
    label: "Destinataire",
    accessor: (row) => row.recipient_email,
  },
  {
    key: "status",
    label: "État",
    accessor: (row) => row.status,
    filterable: true,
    groupable: true,
    // L'état est un **code** dans la donnée : la facette et l'en-tête de
    // groupe portent le libellé français, jamais « sent » ni « failed ».
    facetLabel: (value) => STATUS_LABELS[value] ?? value,
    groupLabel: (value) => STATUS_LABELS[value] ?? value,
    render: (row) => (
      <>
        <Badge
          variant={STATUS_VARIANTS[row.status] ?? "secondary"}
          className="text-[11px]"
        >
          {STATUS_LABELS[row.status] ?? row.status}
        </Badge>
        {row.error_message && (
          <p className="mt-1 max-w-[280px] text-[11px] text-destructive/90">
            {row.error_message}
          </p>
        )}
      </>
    ),
  },
  {
    key: "provider",
    label: "Fournisseur",
    accessor: (row) => row.provider,
    render: (row) => row.provider ?? "—",
  },
  {
    key: "subject",
    label: "Objet",
    accessor: (row) => row.subject,
    render: (row) => row.subject ?? "—",
  },
  {
    // La colonne d'action ne porte pas de valeur : elle n'est ni triable ni
    // filtrable.
    key: "action",
    label: "Action",
    sortable: false,
    align: "right",
  },
];

interface EmailDeliveriesTableProps {
  deliveries: EmailDeliveryRow[];
}

export function EmailDeliveriesTable({ deliveries }: EmailDeliveriesTableProps) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  /**
   * Les lignes **visibles** : celles que le moteur laisse passer.
   *
   * La recherche et la facette « État » remplacent les boutons de filtre :
   * l'écran n'a plus de barre de filtres sur mesure.
   */
  const { groups } = useDataTable({
    tableId: TABLE_ID,
    columns: EMAIL_DELIVERY_COLUMNS,
    rows: deliveries,
  });

  const visible = React.useMemo(
    () => groups.flatMap((group) => group.rows),
    [groups]
  );

  const handleResend = React.useCallback(
    async (delivery: EmailDeliveryRow) => {
      setBusyId(delivery.id);
      setFeedback(null);

      const result = await resendEmailDeliveryAction(delivery.id);

      setBusyId(null);
      setFeedback(result.message);
      router.refresh();
    },
    [router]
  );

  /**
   * La ligne du journal.
   *
   * L'écran garde la main sur sa mise en page — le bouton de rejeu vit
   * ici — ; le moteur lui fournit les **valeurs** des cellules.
   */
  const renderRow = React.useCallback(
    ({
      row,
      cell,
    }: {
      row: EmailDeliveryRow;
      cell: (key: string) => React.ReactNode;
    }) => (
      <TableRow key={row.id}>
        <TableCell className="whitespace-nowrap text-[12px] text-muted-foreground">
          {cell("createdAt")}
        </TableCell>
        <TableCell>{cell("templateCode")}</TableCell>
        <TableCell className="text-[12px] text-muted-foreground">
          {cell("recipient")}
        </TableCell>
        <TableCell>{cell("status")}</TableCell>
        <TableCell className="text-[12px] text-muted-foreground">
          {cell("provider")}
        </TableCell>
        <TableCell className="max-w-[240px] truncate text-[12px] text-muted-foreground">
          {cell("subject")}
        </TableCell>
        <TableCell className="text-right">
          {row.status === "failed" && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={busyId !== null}
              onClick={() => handleResend(row)}
            >
              <RotateCw className="size-3" />
              {busyId === row.id ? "Envoi…" : "Renvoyer"}
            </Button>
          )}
        </TableCell>
      </TableRow>
    ),
    [busyId, handleResend]
  );

  return (
    <div className="space-y-3">
      <DataTableToolbar
        tableId={TABLE_ID}
        columns={EMAIL_DELIVERY_COLUMNS}
        rows={deliveries}
        unitName="livraisons"
        searchPlaceholder="Rechercher un modèle, un destinataire ou un objet..."
      />

      {feedback && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {feedback}
        </p>
      )}

      <Card size="sm">
        <DataTable
          tableId={TABLE_ID}
          columns={EMAIL_DELIVERY_COLUMNS}
          rows={visible}
          getRowId={(delivery) => delivery.id}
          renderRow={renderRow}
          emptyLabel="Aucune livraison pour ce filtre."
          className="rounded-none border-0 shadow-none"
        />
      </Card>
    </div>
  );
}
