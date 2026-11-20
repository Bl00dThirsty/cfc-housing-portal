"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import type { RegisterKey, RegisterRecord } from "@/domain/entities/registers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterTable({
  registerKey, records, query = "", onQueryChange,
}: {
  registerKey: RegisterKey;
  records: RegisterRecord[];
  query?: string;
  onQueryChange?: (value: string) => void;
}) {
  const visible = records.filter((record) =>
    `${record.label} ${record.region ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <section className="space-y-4" aria-label={`Registre ${registerKey}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          aria-label="Rechercher une fiche"
          value={query}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder="Rechercher une fiche…"
          className="max-w-sm"
        />
        <Button asChild>
          <Link href={`/portail-cfc/registres/${registerKey}/nouveau`}>
            <Plus className="size-4" aria-hidden /> Nouvelle fiche
          </Link>
        </Button>
      </div>

      {visible.length === 0 ? (
        <p role="status" className="rounded-md border p-6 text-sm text-muted-foreground">
          Aucune fiche ne correspond à votre périmètre. Créez une fiche ou modifiez la recherche.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {visible.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-4 p-3">
              <Link className="font-medium hover:underline" href={`/portail-cfc/registres/${registerKey}/${record.id}`}>
                {record.label}
              </Link>
              <span className="text-xs text-muted-foreground">{record.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
