"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface EmailDeliveriesTableProps {
  deliveries: EmailDeliveryRow[];
}

export function EmailDeliveriesTable({ deliveries }: EmailDeliveriesTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? deliveries : deliveries.filter((item) => item.status === filter)),
    [deliveries, filter],
  );

  const handleResend = async (delivery: EmailDeliveryRow) => {
    setBusyId(delivery.id);
    setFeedback(null);

    const result = await resendEmailDeliveryAction(delivery.id);

    setBusyId(null);
    setFeedback(result.message);
    router.refresh();
  };

  const filters = [
    { value: "all", label: "Tous" },
    { value: "sent", label: "Envoyés" },
    { value: "failed", label: "Échecs" },
    { value: "skipped", label: "Ignorés" },
    { value: "queued", label: "En file" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {filters.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="xs"
            variant={filter === item.value ? "secondary" : "ghost"}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {feedback && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {feedback}
        </p>
      )}

      <Card size="sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Modèle</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead>État</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="whitespace-nowrap text-[12px] text-muted-foreground">
                  {formatDate(delivery.created_at)}
                </TableCell>
                <TableCell>
                  <span className="font-mono text-[12px] font-medium text-foreground">
                    {delivery.template_code}
                  </span>
                </TableCell>
                <TableCell className="text-[12px] text-muted-foreground">
                  {delivery.recipient_email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={STATUS_VARIANTS[delivery.status] ?? "secondary"}
                    className="text-[11px]"
                  >
                    {STATUS_LABELS[delivery.status] ?? delivery.status}
                  </Badge>
                  {delivery.error_message && (
                    <p className="mt-1 max-w-[280px] text-[11px] text-destructive/90">
                      {delivery.error_message}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-[12px] text-muted-foreground">
                  {delivery.provider ?? "—"}
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-[12px] text-muted-foreground">
                  {delivery.subject ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {delivery.status === "failed" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={busyId !== null}
                      onClick={() => handleResend(delivery)}
                    >
                      <RotateCw className="size-3" />
                      {busyId === delivery.id ? "Envoi…" : "Renvoyer"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                  Aucune livraison pour ce filtre.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
