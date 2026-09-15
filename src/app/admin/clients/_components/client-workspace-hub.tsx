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
import { ClientsTable } from "./clients-table";
import { type ClientItem, clientsData } from "./data";

export function ClientWorkspaceHub() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const clientParam = searchParams.get("clientId");

  const [activeTab, setActiveTab] = React.useState<"clients" | "kanban" | "duc" | "epargne">(
    tabParam === "kanban" ? "kanban" : tabParam === "duc" ? "duc" : tabParam === "epargne" ? "epargne" : "clients"
  );

  const [selectedClientId, setSelectedClientId] = React.useState<string>(
    clientParam || clientsData[0].id
  );

  // Sync state if query params change
  React.useEffect(() => {
    if (tabParam === "kanban" || tabParam === "duc" || tabParam === "clients" || tabParam === "epargne") {
      setActiveTab(tabParam);
    }
    if (clientParam) {
      setSelectedClientId(clientParam);
    }
  }, [tabParam, clientParam]);

  const activeClient =
    clientsData.find((c) => c.id === selectedClientId) || clientsData[0];

  const handleSelectClient = (client: ClientItem) => {
    setSelectedClientId(client.id);
  };

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

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Page Header & Active Client Persistent Strip */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Espace Emprunteurs &amp; Dossiers DUC
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
                {clientsData.map((client) => (
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
              onClick={() => router.push(`/admin/clients/${activeClient.id}`)}
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
        <TabsContent value="clients" className="space-y-4 focus-visible:outline-none">
          <ClientsTable
            selectedClientId={selectedClientId}
            onSelectClient={handleSelectClient}
            onOpenKanban={handleOpenKanban}
            onOpenDuc={handleOpenDuc}
            onOpenEpargne={handleOpenEpargne}
          />
        </TabsContent>

        {/* Tab 2: Kanban du client sélectionné */}
        <TabsContent value="kanban" className="space-y-4 focus-visible:outline-none">
          <ClientKanban
            client={activeClient}
            onSelectClient={handleSelectClient}
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
          <ClientSavingsPassbook client={activeClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
