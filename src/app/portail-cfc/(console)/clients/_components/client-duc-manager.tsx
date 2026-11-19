"use client";

import * as React from "react";
import { FileText, FolderOpen, Search, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewModeToggle, type ViewMode } from "@/components/ui/view-mode-toggle";
import type { ClientDocument, ClientItem } from "@/domain/entities/client";
import { cn } from "@/lib/utils";
import { DucDocumentViewerDialog } from "./duc-document-viewer-dialog";
import { DucUploadDialog } from "./duc-upload-dialog";

export type DucFileKind = "document" | "spreadsheet" | "design" | "pdf" | "archive";

/** Upload dialog compatibility type; the persisted document remains the source of truth. */
export interface DucFile {
  id: string;
  name: string;
  kind: DucFileKind;
  size: string;
  folderId: string;
  owner: string;
  modifiedAt: string;
  starred: boolean;
  status: "Validé" | "En cours" | "Rejeté";
}

export interface DucAuditLogEntry {
  id: string;
  docName: string;
  folderId: string;
  action: "Création & Indexation" | "Visa Favorable" | "Rejet Documentaire" | "Actualisation Version";
  author: string;
  role: string;
  date: string;
  version: string;
  comment?: string;
  status: "Validé" | "Rejeté" | "En attente";
}

interface ClientDucManagerProps {
  client: ClientItem | null;
  onSelectClient?: (client: ClientItem) => void;
}

const statusTone: Record<string, string> = {
  Validé: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Téléversé: "border-transparent bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  "En cours": "border-transparent bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "En attente": "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Rejeté: "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-300",
  Expiré: "border-transparent bg-orange-500/10 text-orange-700 dark:text-orange-300",
};

export function ClientDucManager({ client }: ClientDucManagerProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [view, setView] = React.useState<ViewMode>("list");
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<ClientDocument | null>(null);
  const documents = React.useMemo(() => client?.documents ?? [], [client?.documents]);
  const categories = React.useMemo(
    () => [...new Set(documents.map((document) => document.category).filter((value) => value && value !== "—"))].sort((a, b) => a.localeCompare(b, "fr")),
    [documents],
  );
  const visibleDocuments = React.useMemo(() => documents.filter((document) => {
    const matchesCategory = category === "all" || document.category === category;
    const query = search.trim().toLocaleLowerCase("fr");
    const matchesSearch = !query || [document.name, document.fileName, document.ref, document.status]
      .some((value) => value?.toLocaleLowerCase("fr").includes(query));
    return matchesCategory && matchesSearch;
  }), [documents, category, search]);

  if (!client) {
    return (
      <section className="rounded-lg border bg-card p-8 text-center">
        <FolderOpen className="mx-auto mb-3 size-8 text-muted-foreground" />
        <h2 className="font-semibold">Sélectionnez un dossier</h2>
        <p className="mt-1 text-sm text-muted-foreground">Les pièces affichées proviennent de la GED du dossier.</p>
      </section>
    );
  }

  const handleUploaded = () => {
    setUploadOpen(false);
    router.refresh();
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">Dossier Unique Client</h2>
            <Badge variant="outline" className="font-mono text-[10px]">{client.ducId}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{documents.length} pièce{documents.length === 1 ? "" : "s"} autorisée{documents.length === 1 ? "" : "s"} · {client.name}</p>
        </div>
        <Button type="button" size="sm" className="gap-1.5 text-xs" onClick={() => setUploadOpen(true)}>
          <Upload className="size-3.5" /> Déposer une pièce
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Rechercher une pièce du DUC"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par intitulé, fichier ou référence…"
            className="h-9 pl-8 text-xs"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Filtrer par catégorie" className="h-9 w-full text-xs sm:w-60">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
        <ViewModeToggle value={view} onValueChange={setView} className="self-end sm:self-auto" />
      </div>

      {view === "list" && (
        <div className="grid grid-cols-[minmax(0,1fr)_130px_120px_90px] gap-3 rounded-t-lg border border-b-0 bg-muted/30 px-4 py-2 text-[10px] font-medium text-muted-foreground max-sm:hidden">
          <span>Pièce et nom du fichier</span><span>Catégorie</span><span>État</span><span className="text-right">Action</span>
        </div>
      )}
      {visibleDocuments.length > 0 ? (
        <ul
          role="list"
          aria-label={`Pièces du DUC en ${view === "grid" ? "grille" : "liste"}`}
          className={view === "grid"
            ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            : "overflow-hidden rounded-b-lg border bg-card"}
        >
          {visibleDocuments.map((document) => (
            <li key={document.id} className="list-none">
              {view === "grid" ? (
                <article className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                      <FileText aria-hidden className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{document.name}</p>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">
                        {document.fileName || "Nom de fichier non renseigné"}
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 border-y py-3 text-xs">
                    <div className="min-w-0">
                      <dt className="text-[10px] text-muted-foreground">Catégorie</dt>
                      <dd className="truncate">{document.category}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] text-muted-foreground">Déposé le</dt>
                      <dd className="truncate">{document.date}</dd>
                    </div>
                    {document.fileSize ? (
                      <div>
                        <dt className="text-[10px] text-muted-foreground">Taille</dt>
                        <dd>{document.fileSize}</dd>
                      </div>
                    ) : null}
                    {document.ref ? (
                      <div className="min-w-0">
                        <dt className="text-[10px] text-muted-foreground">Référence</dt>
                        <dd className="truncate font-mono">{document.ref}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <Badge variant="outline" className={cn("w-fit text-[10px]", statusTone[document.status] ?? "border-line-strong bg-muted text-muted-foreground")}>
                      {document.status}
                    </Badge>
                    <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => setPreview(document)}>
                      Ouvrir
                    </Button>
                  </div>
                </article>
              ) : (
                <div className="grid grid-cols-1 items-center gap-2 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_130px_120px_90px] sm:gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{document.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {document.fileName || "Nom de fichier non renseigné"} · {document.date}
                        {document.fileSize ? ` · ${document.fileSize}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="truncate text-xs text-muted-foreground">{document.category}</span>
                  <Badge variant="outline" className={cn("w-fit text-[10px]", statusTone[document.status] ?? "border-line-strong bg-muted text-muted-foreground")}>
                    {document.status}
                  </Badge>
                  <div className="flex justify-start sm:justify-end">
                    <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => setPreview(document)}>
                      Ouvrir
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed bg-card px-4 py-12 text-center">
          <FolderOpen className="mx-auto mb-3 size-7 text-muted-foreground/60" />
          <p className="text-sm font-medium">{documents.length === 0 ? "Aucune pièce enregistrée" : "Aucune pièce ne correspond à la recherche"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {documents.length === 0 ? "Les documents déposés au coffre apparaîtront ici après leur enregistrement." : "Essayez un autre terme ou une autre catégorie."}
          </p>
        </div>
      )}

      <DucUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        client={client}
        onDocumentUploaded={handleUploaded}
      />
      <DucDocumentViewerDialog
        file={preview}
        client={client}
        open={Boolean(preview)}
        onOpenChange={(open) => { if (!open) setPreview(null); }}
      />
    </section>
  );
}
