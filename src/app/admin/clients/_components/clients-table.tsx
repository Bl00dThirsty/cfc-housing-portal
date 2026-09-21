"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Download,
  FileText,
  Phone,
  MapPin,
  Briefcase,
  LayoutGrid,
  List,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Kanban as KanbanIcon,
  Landmark,
  UserPlus,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, getInitials } from "@/lib/utils";
import { type ClientItem, clientsData } from "./data";
import { ClientCreationDialog } from "./client-creation-dialog";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";

export interface ClientsTableProps {
  selectedClientId?: string;
  onSelectClient?: (client: ClientItem) => void;
  onOpenKanban?: (client: ClientItem) => void;
  onOpenDuc?: (client: ClientItem) => void;
  onOpenEpargne?: (client: ClientItem) => void;
}

const phaseBadgeColors: Record<ClientItem["phase"], string> = {
  "Épargne & KYC": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 border-transparent",
  "Risques & BET": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent",
  "Comités CGR/CRC": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border-transparent",
  "Notaire & Hypothèque": "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border-transparent",
  "Déblocages Travaux": "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-transparent",
  "Clôture & Mainlevée": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent",
};

const statusBadgeColors: Record<ClientItem["status"], string> = {
  Conforme: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent",
  Accordé: "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-semibold border-transparent",
  "En Examen": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-transparent",
  "Pièces Manquantes": "bg-rose-500/10 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-transparent",
  Mainlevée: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-transparent",
};

export function ClientsTable({
  selectedClientId,
  onSelectClient,
  onOpenKanban,
  onOpenDuc,
  onOpenEpargne,
}: ClientsTableProps = {}) {
  const router = useRouter();
  const [allClients, setAllClients] = React.useState<ClientItem[]>(clientsData);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [selectedPhases, setSelectedPhases] = React.useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("table");

  const statusOptions = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allClients.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return [
      { label: "Conforme", value: "Conforme", count: counts["Conforme"] || 0 },
      { label: "Accordé", value: "Accordé", count: counts["Accordé"] || 0 },
      { label: "En Examen", value: "En Examen", count: counts["En Examen"] || 0 },
      { label: "Pièces Manquantes", value: "Pièces Manquantes", count: counts["Pièces Manquantes"] || 0 },
      { label: "Mainlevée", value: "Mainlevée", count: counts["Mainlevée"] || 0 },
    ];
  }, [allClients]);

  const phaseOptions = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allClients.forEach((c) => {
      counts[c.phase] = (counts[c.phase] || 0) + 1;
    });
    return [
      { label: "1. Épargne & KYC", value: "Épargne & KYC", count: counts["Épargne & KYC"] || 0 },
      { label: "2. Risques & BET", value: "Risques & BET", count: counts["Risques & BET"] || 0 },
      { label: "3. Comités CGR/CRC", value: "Comités CGR/CRC", count: counts["Comités CGR/CRC"] || 0 },
      { label: "4. Notaire & Hypothèque", value: "Notaire & Hypothèque", count: counts["Notaire & Hypothèque"] || 0 },
      { label: "5. Déblocages Travaux", value: "Déblocages Travaux", count: counts["Déblocages Travaux"] || 0 },
      { label: "6. Clôture & Mainlevée", value: "Clôture & Mainlevée", count: counts["Clôture & Mainlevée"] || 0 },
    ];
  }, [allClients]);

  const agencyOptions = React.useMemo(() => {
    const map = new Map<string, number>();
    allClients.forEach((c) => {
      map.set(c.agency, (map.get(c.agency) || 0) + 1);
    });
    return Array.from(map.entries()).map(([agency, count]) => ({
      label: agency.replace("Agence ", ""),
      value: agency,
      count,
    }));
  }, [allClients]);

  const handleClientCreated = (newClient: ClientItem) => {
    setAllClients((prev) => [newClient, ...prev]);
    onSelectClient?.(newClient);
    onOpenDuc?.(newClient);
  };

  const filteredClients = allClients.filter((client) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      client.name.toLowerCase().includes(q) ||
      client.ducId.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      client.profession.toLowerCase().includes(q) ||
      client.agency.toLowerCase().includes(q);

    const matchesPhase =
      selectedPhases.length === 0 || selectedPhases.includes(client.phase);
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(client.status);
    const matchesAgency =
      selectedAgencies.length === 0 || selectedAgencies.includes(client.agency);

    return matchesSearch && matchesPhase && matchesStatus && matchesAgency;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. KPI Summary Cards Strip (Crisp rounded-lg, zero decorative icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">Total Emprunteurs (DUC)</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-foreground">1 240</span>
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 font-medium text-xs px-2 py-0.5 border-transparent gap-1 rounded-md"
            >
              <ArrowUpRight className="size-3.5" /> +14.8%
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Enrôlements &amp; comptes actifs ce mois</span>
        </div>

        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">Dossiers Complets Conformes</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-foreground">842</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              67.9% complétude
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Toutes pièces scellées reçues</span>
        </div>

        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">En Phase d&apos;Épargne Active</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-foreground">314</span>
            <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
              Apport en cours
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Collecte programmée MoMo / OM</span>
        </div>

        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">Volume Prêts en Instruction</span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-foreground">4,85 Mds</span>
            <span className="text-xs font-semibold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md">
              FCFA
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Octrois &amp; déblocages échelonnés</span>
        </div>
      </div>

      {/* 2. Search, Faceted Filters & Actions Toolbar */}
      <div className="p-3.5 rounded-xl border border-border/40 bg-card/60 shadow-2xs">
        <DataTableToolbar
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par nom, N° DUC, profession, agence..."
          totalCount={allClients.length}
          filteredCount={filteredClients.length}
          unitName="emprunteurs"
          filters={[
            {
              id: "status",
              title: "Statut",
              options: statusOptions,
              selectedValues: selectedStatuses,
              onSelect: setSelectedStatuses,
            },
            {
              id: "phase",
              title: "Circuit",
              options: phaseOptions,
              selectedValues: selectedPhases,
              onSelect: setSelectedPhases,
            },
            {
              id: "agency",
              title: "Agence",
              options: agencyOptions,
              selectedValues: selectedAgencies,
              onSelect: setSelectedAgencies,
            },
          ]}
          onResetAll={() => {
            setSelectedStatuses([]);
            setSelectedPhases([]);
            setSelectedAgencies([]);
          }}
        >
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-border/40 rounded-md p-0.5 bg-muted/20">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className={`h-7 px-2.5 text-xs rounded-xs gap-1.5 font-medium ${viewMode === "cards" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"}`}
              >
                <LayoutGrid className="size-3.5" />
                Cartes
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={`h-7 px-2.5 text-xs rounded-xs gap-1.5 font-medium ${viewMode === "table" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"}`}
              >
                <List className="size-3.5" />
                Tableau
              </Button>
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="h-8 gap-1.5 px-3 text-xs font-semibold rounded-md bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 ml-1"
            >
              <UserPlus className="size-3.5" />
              Nouvelle Entrée en Relation
            </Button>
          </div>
        </DataTableToolbar>
      </div>

      {/* 3. Content Display based on View Mode */}
      {viewMode === "cards" ? (
        /* A. Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-muted-foreground border rounded-lg bg-card">
              Aucun emprunteur ne correspond à vos critères de recherche.
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => router.push(`/admin/clients/${client.id}`)}
                className="rounded-lg border bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between gap-3.5"
              >
                {/* Card Header: Avatar, Name, Phase & Options */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-9 rounded-md">
                      <AvatarFallback className={`rounded-md text-xs font-semibold ${client.avatarTone}`}>
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                        {client.name}
                      </h3>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {client.profession} · {client.employer}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 rounded-md text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-md">
                        <DropdownMenuLabel className="text-xs font-semibold">Actions Emprunteur</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="cursor-pointer text-xs"
                        >
                          <FileText className="size-3.5 mr-2 text-muted-foreground" />
                          Consulter la fiche DUC
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/clients/${client.id}`)}
                          className="cursor-pointer text-xs"
                        >
                          <Download className="size-3.5 mr-2 text-muted-foreground" />
                          Exporter Dossier PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-xs">
                          <Phone className="size-3.5 mr-2 text-muted-foreground" />
                          {client.phone}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Badges strip */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px] font-semibold bg-muted/30 h-5 px-1.5 rounded-md">
                    {client.ducId}
                  </Badge>
                  <Badge className={`${phaseBadgeColors[client.phase]} text-[10px] h-5 px-1.5 rounded-md font-medium`}>
                    {client.phase}
                  </Badge>
                  <Badge className={`${statusBadgeColors[client.status]} text-[10px] h-5 px-1.5 rounded-md font-medium`}>
                    {client.status}
                  </Badge>
                </div>

                {/* Financial Balance Summary (Épuré sans surcharge de jauge) */}
                <div className="rounded-md border bg-muted/20 p-2.5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">Crédit Sollicité</span>
                      <span className="text-sm font-bold font-mono text-foreground">{client.loanAmount}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">Épargne Mobilisée</span>
                      <div className="flex items-baseline justify-end gap-1 font-mono">
                        <span className="text-xs font-bold text-primary">{client.savingsCurrent}</span>
                        <span className="text-[10px] text-muted-foreground">/ {client.savingsTarget}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/50">
                    <span className="text-muted-foreground text-[10px]">Couverture Apport Personnel</span>
                    <span className={cn(
                      "font-mono font-bold text-xs px-2 py-0.5 rounded-md",
                      client.savingsPercent >= 100 
                        ? "bg-emerald-500/10 text-emerald-700" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {client.savingsPercent}% atteint
                    </span>
                  </div>
                </div>

                {/* Project Details & Location */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1 truncate">
                      <Briefcase className="size-3 text-muted-foreground/70" />
                      {client.projectType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="size-3 text-muted-foreground/70" />
                      {client.agency}
                    </span>
                    <span className="font-mono text-[10px] text-foreground/80">{client.landTitle}</span>
                  </div>
                </div>

                {/* Card Footer: Last activity + Action text */}
                <div className="flex items-center justify-between pt-2.5 border-t text-[11px] text-muted-foreground">
                  <span>{client.lastActivity}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground group-hover:text-primary transition-colors">
                    Fiche détaillée
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* B. Main Data Table View */
        <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center text-xs font-medium text-foreground px-3">#</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Client / Emprunteur</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Projet &amp; Agence</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Montant Prêt</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Apport Réalisé</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Phase du Circuit</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Conformité</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                    Aucun emprunteur ne correspond à vos critères de recherche.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client, index) => {
                  const isSelected = client.id === selectedClientId;
                  return (
                    <TableRow
                      key={client.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected
                          ? "bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary"
                          : "hover:bg-muted/30"
                      )}
                      onClick={() => {
                        if (onSelectClient) {
                          onSelectClient(client);
                        } else {
                          router.push(`/admin/clients/${client.id}`);
                        }
                      }}
                    >
                      <TableCell className="text-center font-mono text-xs text-muted-foreground px-3 py-2.5">
                        {index + 1}
                      </TableCell>

                      {/* Client Info */}
                      <TableCell className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8 rounded-md">
                            <AvatarFallback className={`rounded-md text-xs font-semibold ${client.avatarTone}`}>
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-xs truncate text-foreground flex items-center gap-1">
                              {client.name}
                              {isSelected && (
                                <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-primary/20 text-primary rounded-xs">
                                  Actif
                                </Badge>
                              )}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {client.profession}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* DUC ID */}
                      <TableCell className="px-3 py-2.5">
                        <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2 rounded-md">
                          {client.ducId}
                        </Badge>
                      </TableCell>

                      {/* Project & Agency */}
                      <TableCell className="px-3 py-2.5">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">
                            {client.projectType}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="size-3" />
                            {client.agency}
                          </span>
                        </div>
                      </TableCell>

                      {/* Loan Amount */}
                      <TableCell className="text-right px-3 py-2.5">
                        <span className="font-semibold text-xs text-foreground font-mono">
                          {client.loanAmount}
                        </span>
                      </TableCell>

                      {/* Savings & Apport Personnel (Épuré sans jauge) */}
                      <TableCell className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5 min-w-[100px]">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "font-mono font-bold text-xs px-1.5 py-0.5 rounded",
                              client.savingsPercent >= 100
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-muted text-foreground"
                            )}>
                              {client.savingsPercent}%
                            </span>
                            <span className="text-muted-foreground font-mono text-[11px] font-medium">{client.savingsCurrent}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">Cible: {client.savingsTarget}</span>
                        </div>
                      </TableCell>

                      {/* Workflow Phase */}
                      <TableCell className="px-3 py-2.5">
                        <Badge className={`${phaseBadgeColors[client.phase]} rounded-md text-xs`}>
                          {client.phase}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-3 py-2.5">
                        <Badge className={`${statusBadgeColors[client.status]} rounded-md text-xs`}>
                          {client.status}
                        </Badge>
                      </TableCell>

                      {/* Actions dropdown */}
                      <TableCell className="text-right pr-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 rounded-md text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-md">
                            <DropdownMenuLabel className="text-xs font-semibold">Actions Client</DropdownMenuLabel>
                            {onSelectClient && (
                              <DropdownMenuItem
                                onClick={() => onSelectClient(client)}
                                className="cursor-pointer text-xs font-medium text-primary"
                              >
                                <CheckCircle2 className="size-3.5 mr-2 text-primary" />
                                Sélectionner ce client
                              </DropdownMenuItem>
                            )}
                            {onOpenKanban && (
                              <DropdownMenuItem
                                onClick={() => onOpenKanban(client)}
                                className="cursor-pointer text-xs"
                              >
                                <KanbanIcon className="size-3.5 mr-2 text-primary" />
                                Ouvrir le Kanban du client
                              </DropdownMenuItem>
                            )}
                            {onOpenDuc && (
                              <DropdownMenuItem
                                onClick={() => onOpenDuc(client)}
                                className="cursor-pointer text-xs"
                              >
                                <FolderOpen className="size-3.5 mr-2 text-primary" />
                                Consulter son DUC (GED)
                              </DropdownMenuItem>
                            )}
                            {onOpenEpargne && (
                              <DropdownMenuItem
                                onClick={() => onOpenEpargne(client)}
                                className="cursor-pointer text-xs"
                              >
                                <Landmark className="size-3.5 mr-2 text-primary" />
                                Carnet d&apos;Épargne
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/admin/clients/${client.id}`)} className="cursor-pointer text-xs">
                              <FileText className="size-3.5 mr-2 text-muted-foreground" />
                              Fiche Emprunteur détaillée
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/clients/${client.id}`)} className="cursor-pointer text-xs">
                              <Download className="size-3.5 mr-2 text-muted-foreground" />
                              Exporter Dossier PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-xs text-muted-foreground">
                              <Phone className="size-3.5 mr-2" />
                              {client.phone}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <span>
              Affichage de <strong>{filteredClients.length}</strong> sur <strong>{allClients.length}</strong> emprunteurs répertoriés
            </span>
            <span className="font-medium">
              Crédit Foncier du Cameroun · Direction du Crédit &amp; Recouvrement
            </span>
          </div>
        </div>
      )}

      {/* Dialog d'Enrôlement & Ouverture de Compte Client (CFC-02) */}
      <ClientCreationDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
