"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Database, Search } from "lucide-react";

import type { OperationalRegisterRecord } from "@/domain/entities/operational-register";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export function OperationalRegisterView({
  title,
  description,
  records,
}: {
  title: string;
  description: string;
  records: OperationalRegisterRecord[];
}) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const visibleRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return records;
    return records.filter((record) =>
      [record.dossierCode ?? "", record.status, ...record.fields.map((item) => item.value)]
        .some((value) => value.toLocaleLowerCase("fr").includes(query)),
    );
  }, [records, search]);

  return (
    <section className="space-y-5" aria-labelledby="register-title">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 id="register-title" className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="tabular-nums">{visibleRecords.length} enregistrement{visibleRecords.length === 1 ? "" : "s"}</Badge>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher dans les enregistrements"
            aria-label="Rechercher dans le registre"
            className="pl-9"
          />
        </div>
        <ViewModeToggle value={view} onValueChange={setView} />
      </div>

      {visibleRecords.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
          <Database className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 font-semibold">{records.length === 0 ? "Aucun enregistrement dans le registre" : "Aucun résultat"}</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
            {records.length === 0
              ? "Les lignes affichées proviennent uniquement des données enregistrées dans Supabase et autorisées par votre rôle."
              : "Modifiez la recherche pour retrouver un enregistrement."}
          </p>
        </div>
      ) : (
        view === "grid" ? (
          <ul
            role="list"
            aria-label="Enregistrements en grille"
            className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            {visibleRecords.map((record) => (
              <li key={record.id} className="list-none">
                <article className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {record.dossierId && record.dossierCode ? (
                        <Link href={`/portail-cfc/dossiers/${record.dossierId}`} className="truncate font-mono text-xs font-semibold underline-offset-4 hover:underline">
                          {record.dossierCode}
                        </Link>
                      ) : (
                        <p className="truncate font-mono text-xs font-semibold">{record.dossierCode ?? "—"}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(record.occurredAt)}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{record.status}</Badge>
                  </header>
                  <dl className="grid gap-x-4 gap-y-2 border-t pt-3 text-xs sm:grid-cols-2">
                    {record.fields.map((item) => (
                      <div key={`${record.id}-${item.label}`} className="min-w-0">
                        <dt className="text-[10px] text-muted-foreground">{item.label}</dt>
                        <dd className="truncate font-medium">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence DUC</TableHead>
                  <TableHead>Détails enregistrés</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">
                      {record.dossierId && record.dossierCode ? (
                        <Link href={`/portail-cfc/dossiers/${record.dossierId}`} className="font-mono text-xs font-medium underline-offset-4 hover:underline">
                          {record.dossierCode}
                        </Link>
                      ) : <span className="font-mono text-xs text-muted-foreground">{record.dossierCode ?? "—"}</span>}
                    </TableCell>
                    <TableCell>
                      <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2 xl:grid-cols-3">
                        {record.fields.map((item) => (
                          <div key={`${record.id}-${item.label}`} className="flex min-w-0 gap-1.5">
                            <dt className="shrink-0 text-muted-foreground">{item.label} :</dt>
                            <dd className="truncate font-medium">{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{record.status}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(record.occurredAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}
    </section>
  );
}
