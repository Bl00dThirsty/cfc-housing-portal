"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
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
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

export interface ClientsTableProps {
  selectedClientId?: string;
  onSelectClient?: (client: ClientItem) => void;
  onOpenKanban?: (client: ClientItem) => void;
  onOpenDuc?: (client: ClientItem) => void;
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
}: ClientsTableProps = {}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedPhase, setSelectedPhase] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("table");

  const filteredClients = clientsData.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.ducId.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      client.profession.toLowerCase().includes(search.toLowerCase()) ||
      client.agency.toLowerCase().includes(search.toLowerCase());

    const matchesPhase = selectedPhase === "all" || client.phase === selectedPhase;
    const matchesStatus = selectedStatus === "all" || client.status === selectedStatus;

    return matchesSearch && matchesPhase && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. KPI Summary Cards Strip (Crisp rounded-lg, zero decorative icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="rounded-lg border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium">Total Emprunteurs DUC</span>
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

      {/* 2. Search, Filters & View Mode Switcher */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3.5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par nom, N° DUC, profession, email ou agence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by phase */}
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="h-8 rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="all">Toutes les phases</option>
              <option value="Épargne & KYC">1. Épargne &amp; KYC</option>
              <option value="Risques & BET">2. Risques &amp; BET</option>
              <option value="Comités CGR/CRC">3. Comités CGR/CRC</option>
              <option value="Notaire & Hypothèque">4. Notaire &amp; Hypothèque</option>
              <option value="Déblocages Travaux">5. Déblocages Travaux</option>
              <option value="Clôture & Mainlevée">6. Clôture &amp; Mainlevée</option>
            </select>

            {/* Filter by status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 rounded-md border bg-background px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="Conforme">Conforme</option>
              <option value="Accordé">Accordé</option>
              <option value="En Examen">En Examen</option>
              <option value="Pièces Manquantes">Pièces Manquantes</option>
              <option value="Mainlevée">Mainlevée</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md p-0.5 bg-muted/20">
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

            <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium rounded-md ml-1">
              <Download className="size-3.5" />
              Exporter
            </Button>
          </div>
        </div>
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

                {/* Financial Gauge Box */}
                <div className="rounded-md border bg-muted/25 p-3 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Crédit Sollicité</span>
                      <span className="text-sm font-bold font-mono text-foreground">{client.loanAmount}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Apport Mobilisé</span>
                      <span className="text-xs font-semibold font-mono text-foreground">{client.savingsCurrent}</span>
                    </div>
                  </div>
                  <Progress value={client.savingsPercent} className="h-1.5 rounded-xs" />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                    <span>Objectif 20% : <strong>{client.savingsTarget}</strong></span>
                    <span className="font-semibold text-foreground">{client.savingsPercent}%</span>
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

                      {/* Savings Progress */}
                      <TableCell className="px-3 py-2.5">
                        <div className="flex flex-col gap-1 min-w-[90px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-foreground">{client.savingsPercent}%</span>
                            <span className="text-muted-foreground font-mono text-[10px]">{client.savingsCurrent}</span>
                          </div>
                          <Progress value={client.savingsPercent} className="h-1.5 rounded-xs" />
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
              Affichage de <strong>{filteredClients.length}</strong> sur <strong>{clientsData.length}</strong> emprunteurs répertoriés
            </span>
            <span className="font-medium">
              Crédit Foncier du Cameroun · Direction du Crédit &amp; Recouvrement
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
