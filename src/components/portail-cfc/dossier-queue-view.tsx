"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FolderKanban, Search } from "lucide-react";

import type { OperationalDossier } from "@/domain/entities/operational-dossier";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";
import { StaffIntakeDialog } from "@/components/portail-cfc/staff-intake-dialog";

function displayDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function DossierQueueView({
  dossiers,
  title,
  description,
  canCreate = false,
  intakeRegions = [],
  intakeDiasporaAvailable = false,
}: {
  dossiers: OperationalDossier[];
  title: string;
  description: string;
  canCreate?: boolean;
  intakeRegions?: string[];
  intakeDiasporaAvailable?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const visibleDossiers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return dossiers;
    return dossiers.filter((dossier) => [
      dossier.ducCode,
      dossier.region,
      dossier.agency,
      dossier.phaseCode,
      dossier.status,
    ].some((value) => value.toLocaleLowerCase("fr").includes(query)));
  }, [dossiers, search]);

  return (
    <section className="space-y-5" aria-labelledby="queue-title">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 id="queue-title" className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="tabular-nums">
            {visibleDossiers.length} dossier{visibleDossiers.length === 1 ? "" : "s"}
          </Badge>
          {canCreate ? <StaffIntakeDialog regions={intakeRegions} diasporaAvailable={intakeDiasporaAvailable} /> : null}
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un numéro DUC, une agence ou une étape"
            aria-label="Rechercher dans les dossiers affichés"
            className="pl-9"
          />
        </div>
        <ViewModeToggle value={view} onValueChange={setView} />
      </div>

      {visibleDossiers.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
          <FolderKanban className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 font-semibold">{dossiers.length === 0 ? "Aucun dossier enregistré dans ce périmètre" : "Aucun résultat"}</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
            {dossiers.length === 0
              ? "Les lignes apparaîtront après enregistrement d’un dossier correspondant à cette file. Aucune donnée de démonstration n’est substituée aux données opérationnelles."
              : "Modifiez la recherche pour retrouver un dossier."}
          </p>
        </div>
      ) : (
        <ul
          role="list"
          aria-label={`Dossiers en ${view === "grid" ? "grille" : "liste"}`}
          className={view === "grid"
            ? "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
            : "divide-y overflow-hidden rounded-lg border bg-card"}
        >
          {visibleDossiers.map((dossier) => (
            <li key={dossier.id} className="list-none">
              <article className={view === "grid"
                ? "flex h-full flex-col gap-3 rounded-lg border bg-card p-4"
                : "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"}>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-mono text-sm font-semibold">{dossier.ducCode}</h2>
                    <Badge variant="secondary" className="text-[10px]">{dossier.status}</Badge>
                    {dossier.isDiaspora ? <Badge variant="outline" className="text-[10px]">Diaspora</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dossier.region} · {dossier.agency} · {dossier.phaseCode}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Dernière mise à jour : {displayDate(dossier.updatedAt)}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5">
                  <Link href={`/portail-cfc/dossiers/${dossier.id}`}>
                    État opérationnel <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </Button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
