"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  FileText,
  FolderOpen,
  Kanban as KanbanIcon,
  Landmark,
  User,
  Users,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";

import { ClientDucManager } from "./client-duc-manager";
import { ClientKanban } from "./client-kanban";
import { ClientSavingsPassbook } from "./client-savings-passbook";
import { ClientsCommandMenu } from "@/components/clients/command-menu/clients-command-menu";
import { ClientDetailSheet } from "@/components/clients/detail/client-detail-sheet";
import { ClientsTable } from "@/components/clients/table/clients-table";
import { type ClientItem } from "@/domain/entities/client";
import type { ProcessPhase } from "@/domain/entities/process-phase";

type SavingsCapabilities = { canCredit: boolean; canDebit: boolean; canValidate: boolean; canReverse: boolean };

export function ClientWorkspaceHub({
  clients,
  phases = [],
  loadError,
  savingsCapabilities = { canCredit: false, canDebit: false, canValidate: false, canReverse: false },
  canOpenProfile = false,
}: {
  clients: ClientItem[];
  phases?: ProcessPhase[];
  loadError?: string;
  savingsCapabilities?: SavingsCapabilities;
  canOpenProfile?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const clientParam = searchParams.get("clientId");

  const [activeTab, setActiveTab] = React.useState<"clients" | "kanban" | "duc" | "epargne">(
    tabParam === "kanban" ? "kanban" : tabParam === "duc" ? "duc" : tabParam === "epargne" ? "epargne" : "clients"
  );

  const [selectedClientId, setSelectedClientId] = React.useState<string>(
    clientParam || clients[0]?.id || ""
  );

  /**
   * L'état d'interface du répertoire.
   *
   * Il vit ici, dans le **parent commun** du tableau, de la fiche de détail
   * et du menu de commandes : ces trois-là sont ses enfants, ils ne peuvent
   * pas la partager autrement. La fiche ouverte est portée par son identifiant
   * — `null` signifie « aucune fiche ouverte ».
   */
  const [detailClientId, setDetailClientId] = React.useState<string | null>(null);
  const [commandOpen, setCommandOpen] = React.useState(false);

  // Sync state if query params change
  React.useEffect(() => {
    if (tabParam === "kanban" || tabParam === "duc" || tabParam === "clients" || tabParam === "epargne") {
      setActiveTab(tabParam);
    }
    if (clientParam) {
      setSelectedClientId(clientParam);
    }
  }, [tabParam, clientParam]);

  const activeClient = clients.find((client) => client.id === selectedClientId) ?? clients[0];

  const handleSelectClient = (client: ClientItem) => {
    setSelectedClientId(client.id);
  };

  /**
   * L'activation d'un emprunteur : il devient l'emprunteur courant et sa
   * fiche s'ouvre. C'est ce que faisait la ligne du répertoire avant la
   * migration ; le hub en est désormais le seul propriétaire.
   */
  const handleOpenClient = React.useCallback((client: ClientItem) => {
    setSelectedClientId(client.id);
    if (canOpenProfile) setDetailClientId(client.id);
    else router.push(`/portail-cfc/dossiers/${client.id}`);
  }, [canOpenProfile, router]);

  /** Fermer la fiche : le hub oublie l'emprunteur ouvert. */
  const handleDetailOpenChange = React.useCallback((open: boolean) => {
    if (!open) setDetailClientId(null);
  }, []);

  const detailClient = React.useMemo(
    () => clients.find((client) => client.id === detailClientId) ?? null,
    [clients, detailClientId],
  );

  const handleOpenKanban = (client: ClientItem) => {
    setSelectedClientId(client.id);
    setActiveTab("kanban");
  };

  const handleOpenDuc = (client: ClientItem) => {
    setSelectedClientId(client.id);
    setActiveTab("duc");
  };

  const handleOpenEpargne = (client: ClientItem) => {
    setSelectedClientId(client.id);
    setActiveTab("epargne");
  };

  if (!activeClient) {
    return (
      <section className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Espace Emprunteurs &amp; DUC</h1>
          <p className="text-sm text-muted-foreground">Dossiers auxquels votre compte est autorisé.</p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center">
          <Users className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h2 className="font-semibold">{loadError ? "Portefeuille indisponible" : "Aucun dossier accessible"}</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
            {loadError ?? "Aucun dossier n’est actuellement affecté à votre périmètre. Les nouveaux dossiers apparaîtront ici après leur affectation."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Page Header & Active Client Persistent Strip */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Espace Emprunteurs &amp; Dossier Unique Client (DUC)
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Gestion 360° du cycle de crédit : répertoire des clients, pipeline Kanban individuel par étapes et chemises numériques DUC (GED scellée).
          </p>
        </div>

        {/* Persistent Active Client Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-lg border bg-card shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className={cn("size-10 rounded-md border", activeClient.avatarTone)}>
              <AvatarFallback className="text-xs font-bold">{getInitials(activeClient.name)}</AvatarFallback>
            </Avatar>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground truncate">{activeClient.name}</span>
                <Badge variant="outline" className="font-mono text-[10.5px] font-semibold bg-muted/40 h-4.5 px-1.5 rounded-md">
                  {activeClient.ducId}
                </Badge>
                <Badge variant="secondary" className="text-[10px] rounded-md font-medium">
                  {activeClient.phase}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {activeClient.projectType} · Prêt: <strong className="text-foreground">{activeClient.loanAmount}</strong> · Apport:{" "}
                <strong className="text-foreground">{activeClient.savingsCurrent}</strong> ({activeClient.savingsPercent}%) · {activeClient.agency}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Fast Switcher Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-md">
                  <Users className="size-3.5 text-primary" />
                  Changer d&apos;emprunteur
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto p-1.5 rounded-md">
                <DropdownMenuLabel className="text-xs font-semibold">Sélectionner un emprunteur</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {clients.map((client) => (
                  <DropdownMenuItem
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer text-xs",
                      client.id === activeClient.id && "bg-primary/10 font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className={cn("size-6 rounded-md", client.avatarTone)}>
                        <AvatarFallback className="text-[9px] font-bold">{getInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-foreground">{client.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{client.ducId}</span>
                      </div>
                    </div>
                    {client.id === activeClient.id && (
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 rounded-md"
              onClick={() => router.push(`/portail-cfc/clients/${activeClient.id}`)}
            >
              <FileText className="size-3.5 text-muted-foreground" />
              Fiche détaillée
            </Button>
          </div>
        </div>
      </div>

      {/* 2. 3 Main Tabs: Répertoire, Kanban, DUC */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "clients" | "kanban" | "duc" | "epargne")}
        className="space-y-4"
      >
        <TabsList className="w-full sm:w-fit grid grid-cols-4 h-10 p-1 rounded-lg bg-muted/60">
          <TabsTrigger value="clients" className="gap-2 text-xs font-semibold rounded-md">
            <User className="size-3.5" />
            1. Répertoire Emprunteurs
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2 text-xs font-semibold rounded-md">
            <KanbanIcon className="size-3.5" />
            2. Tableau Kanban
            <Badge variant="secondary" className="h-4 px-1 text-[9px] rounded-xs bg-background/80 ml-1">
              {activeClient.name.split(" ")[0]}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="duc" className="gap-2 text-xs font-semibold rounded-md">
            <FolderOpen className="size-3.5" />
            3. Dossier Unique (DUC)
          </TabsTrigger>
          <TabsTrigger value="epargne" className="gap-2 text-xs font-semibold rounded-md">
            <Landmark className="size-3.5" />
            4. Carnet d&apos;Épargne
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Répertoire Emprunteurs */}
        <TabsContent value="clients" className="space-y-3 focus-visible:outline-none">
          <ClientsTable
            clients={clients}
            selectedClientId={selectedClientId}
            onSelectClient={handleOpenClient}
            onOpenKanban={handleOpenKanban}
            onOpenDuc={handleOpenDuc}
            onOpenEpargne={handleOpenEpargne}
          />
        </TabsContent>

        {/* Tab 2: Kanban du client sélectionné */}
        <TabsContent value="kanban" className="space-y-4 focus-visible:outline-none">
          <ClientKanban
            client={activeClient}
            phases={phases}
            onOpenDuc={() => setActiveTab("duc")}
          />
        </TabsContent>

        {/* Tab 3: DUC (UI File Manager) du client sélectionné */}
        <TabsContent value="duc" className="space-y-4 focus-visible:outline-none">
          <ClientDucManager
            client={activeClient}
            onSelectClient={handleSelectClient}
          />
        </TabsContent>

        {/* Tab 4: Carnet d'Épargne du client sélectionné */}
        <TabsContent value="epargne" className="space-y-4 focus-visible:outline-none">
          <ClientSavingsPassbook client={activeClient} capabilities={savingsCapabilities} />
        </TabsContent>
      </Tabs>

      {canOpenProfile ? (
        <ClientDetailSheet
          client={detailClient}
          open={detailClientId !== null}
          onOpenChange={handleDetailOpenChange}
          onOpenKanban={handleOpenKanban}
          onOpenDuc={handleOpenDuc}
          onOpenEpargne={handleOpenEpargne}
        />
      ) : null}

      <ClientsCommandMenu
        clients={clients}
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onSelect={handleOpenClient}
      />
    </div>
  );
}
