"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, Layers, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavSubItem {
  id: string;
  title: string;
  href?: string;
  badge?: "soon" | "live" | "new" | string;
}

interface NavItem {
  id: string;
  title: string;
  href: string;
  badge?: string;
  groupCode?: string;
  subItems?: NavSubItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Vue Globale",
    items: [
      {
        id: "analytics",
        title: "Analytics & Pilotage",
        href: "/admin/analytics",
        badge: "Live",
        groupCode: "Supervision Stratégique",
        subItems: [
          { id: "analytics-overview", title: "Synthèse Indicateurs & KPI", href: "/admin/analytics" },
          { id: "analytics-core-banking", title: "Supervision Core Banking Carthago", badge: "soon" },
          { id: "analytics-audit", title: "Journal d'Audit & Conformité", badge: "soon" },
        ],
      },
      {
        id: "clients",
        title: "Emprunteurs & Dossiers DUC",
        href: "/admin/clients",
        badge: "Hub",
        groupCode: "Portefeuille, Kanban & DUC",
        subItems: [
          { id: "clients-table", title: "1. Répertoire Emprunteurs", href: "/admin/clients" },
          { id: "clients-kanban", title: "2. Kanban par Client", href: "/admin/clients?tab=kanban" },
          { id: "clients-duc", title: "3. Dossier Numérique DUC", href: "/admin/clients?tab=duc" },
        ],
      },
      {
        id: "kanban",
        title: "Pipeline Global (Multi-Clients)",
        href: "/admin/kanban",
        badge: "Global",
        groupCode: "Instruction & Délais",
        subItems: [
          { id: "kanban-board", title: "Tableau Kanban Global", href: "/admin/kanban" },
          { id: "kanban-list", title: "Vue Liste Chronologique", href: "/admin/kanban" },
        ],
      },
    ],
  },
  {
    title: "Acteurs Guichet Unique",
    items: [
      {
        id: "agency",
        title: "Agence Commerciale",
        href: "/admin/actors/agency",
        badge: "G1",
        groupCode: "Groupe G1 · Production des Crédits",
        subItems: [
          { id: "agency-main", title: "Enrôlement & Épargne Habitat", href: "/admin/actors/agency" },
          { id: "agency-momo", title: "Collecte Mobile Money (MoMo)", href: "/admin/actors/agency/mobile-money" },
          { id: "agency-simulator", title: "Simulateur d'Apport & Scoring", href: "/admin/actors/agency/simulator" },
          { id: "agency-promoters", title: "Partenariats Promoteurs & SIC", href: "/admin/actors/agency/promoters" },
          { id: "agency-diaspora", title: "Guichet Diaspora & Étranger", href: "/admin/actors/agency/diaspora" },
        ],
      },
      {
        id: "risk-engineering",
        title: "Risques & BET",
        href: "/admin/actors/risk-engineering",
        badge: "G3",
        groupCode: "Groupe G3 · Expertise Technique & Risques",
        subItems: [
          { id: "risk-main", title: "Contre-Expertise Devis & Plans", href: "/admin/actors/risk-engineering" },
          { id: "risk-reports", title: "Rapports de Visite Chantier", href: "/admin/actors/risk-engineering/site-reports" },
          { id: "risk-solvency", title: "Centrale des Risques & Solvabilité", href: "/admin/actors/risk-engineering/solvency" },
          { id: "risk-directory", title: "Annuaire BET & Experts Agréés", href: "/admin/actors/risk-engineering/directory" },
          { id: "risk-environment", title: "Scoring Géotechnique & Urbain", href: "/admin/actors/risk-engineering/geotech-urban" },
        ],
      },
      {
        id: "credit-committees",
        title: "Comités CGR / CRC",
        href: "/admin/actors/credit-committees",
        badge: "G6",
        groupCode: "Groupe G6 · Comités Décisionnels & Gouvernance",
        subItems: [
          { id: "committees-main", title: "Arbitrages & Délibérations Octroi", href: "/admin/actors/credit-committees" },
          { id: "committees-cgr", title: "Comité Gestion des Risques (CGR)", href: "/admin/actors/credit-committees/cgr" },
          { id: "committees-crc", title: "Comité Règlement Créances (CRC)", href: "/admin/actors/credit-committees/crc" },
          { id: "committees-offers", title: "Génération Accords & Offres de Prêt", href: "/admin/actors/credit-committees/loan-offers" },
          { id: "committees-board", title: "Dossiers Institutionnels Attaché PCA", href: "/admin/actors/credit-committees/board-institutional" },
        ],
      },
      {
        id: "notary-cadastre",
        title: "Notaires & Cadastre",
        href: "/admin/actors/notary-cadastre",
        badge: "G8",
        groupCode: "Groupe G8 · Notariat & Affaires Juridiques",
        subItems: [
          { id: "notary-main", title: "Conventions & Hypothèque 1er Rang", href: "/admin/actors/notary-cadastre" },
          { id: "notary-cadastre-docs", title: "Liaison Cadastre & Certificats MINDCAF", href: "/admin/actors/notary-cadastre/cadastre-docs" },
          { id: "notary-directory", title: "Études Notariales & Suivi Minutes", href: "/admin/actors/notary-cadastre/directory" },
          { id: "notary-insurances", title: "Assurances Décès, Incendie & TRC", href: "/admin/actors/notary-cadastre/insurances" },
          { id: "notary-oppositions", title: "Contrôle Pré-notations Foncier", href: "/admin/actors/notary-cadastre/oppositions" },
        ],
      },
      {
        id: "disbursements",
        title: "DFBC Décaissements",
        href: "/admin/actors/disbursements",
        badge: "G7",
        groupCode: "Groupe G7 · Finances, Budget & Comptabilité",
        subItems: [
          { id: "disbursements-main", title: "Déblocages par Tranche (VD)", href: "/admin/actors/disbursements" },
          { id: "disbursements-systac", title: "Ordres de Virement SYSTAC", href: "/admin/actors/disbursements/systac" },
          { id: "disbursements-schedules", title: "Tableaux d'Amortissement", href: "/admin/actors/disbursements/schedules" },
          { id: "disbursements-subsidies", title: "Comptabilité Prêts Bonifiés", href: "/admin/actors/disbursements/subsidies" },
          { id: "disbursements-recovery", title: "Recouvrement & Pré-Contentieux", href: "/admin/actors/disbursements/recovery" },
        ],
      },
      {
        id: "mortgage-release",
        title: "Clôture & Mainlevée",
        href: "/admin/actors/mortgage-release",
        badge: "G4",
        groupCode: "Groupe G4 · Clôture, Mainlevée & Conservation",
        subItems: [
          { id: "release-main", title: "Décompte Extinction à Solde Nul", href: "/admin/actors/mortgage-release" },
          { id: "release-deeds", title: "Actes de Mainlevée Notariée", href: "/admin/actors/mortgage-release/deeds" },
          { id: "release-registry", title: "Radiation Hypothèque Cadastre", href: "/admin/actors/mortgage-release/registry" },
          { id: "release-titles", title: "Restitution Titres Fonciers Originaux", href: "/admin/actors/mortgage-release/titles" },
          { id: "release-archive", title: "Clôture Définitive & Archivage DUC", href: "/admin/actors/mortgage-release/archive" },
        ],
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-card text-card-foreground">
      {/* Header / Brand */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <Link href="/admin/analytics" className="flex items-center gap-2.5 font-semibold text-sm">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Layers className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight font-semibold tracking-tight">CFC Admin</span>
            <span className="text-[10px] text-muted-foreground font-normal">CFC Enterprise Portal</span>
          </div>
        </Link>
        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4.5">
          v2.2
        </Badge>
      </div>

      {/* Nav List - Ultra Clean / Pure Typography / Flyout Sub-Apps (...) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h4 className="flex h-7 items-center px-2 text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
              {section.title}
            </h4>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex h-8 items-center justify-between rounded-lg px-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    )}
                  >
                    {/* Primary direct link (NO ICON) */}
                    <Link
                      href={item.href}
                      className="flex-1 truncate py-1.5 pr-1 text-xs"
                    >
                      {item.title}
                    </Link>

                    {/* Right side: Badge + Flyout Menu Trigger (...) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-normal px-1.5 py-0 h-4.5",
                            isActive ? "bg-background/80 text-foreground" : "bg-muted/60 text-muted-foreground"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}

                      {/* Dropdown Menu for Sub-Applications */}
                      {item.subItems && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 focus-visible:opacity-100"
                              aria-label={`Applications pour ${item.title}`}
                            >
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="right"
                            align="start"
                            sideOffset={8}
                            className="w-72 p-1.5 shadow-xl border rounded-xl"
                          >
                            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-foreground font-semibold">{item.title}</span>
                                {item.groupCode && (
                                  <span className="text-[11px] font-normal text-muted-foreground">
                                    {item.groupCode}
                                  </span>
                                )}
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <div className="space-y-0.5 pt-0.5">
                              {item.subItems.map((sub) => {
                                if (sub.href) {
                                  return (
                                    <DropdownMenuItem key={sub.id} asChild>
                                      <Link
                                        href={sub.href}
                                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                                          <span className="truncate font-medium">{sub.title}</span>
                                        </div>
                                        <Badge
                                          variant="secondary"
                                          className="text-[9px] font-medium text-emerald-700 bg-emerald-500/10 px-1.5 py-0 h-4 border-transparent shrink-0"
                                        >
                                          Actif
                                        </Badge>
                                      </Link>
                                    </DropdownMenuItem>
                                  );
                                }

                                return (
                                  <div
                                    key={sub.id}
                                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg text-muted-foreground/80 hover:bg-muted/30 select-none transition-colors"
                                  >
                                    <span className="truncate">{sub.title}</span>
                                    {sub.badge && (
                                      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/90 bg-muted px-1.5 py-0.5 rounded border border-border/50 shrink-0">
                                        {sub.badge}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick info card */}
        <div className="rounded-xl border bg-muted/40 p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Guichet Unique Connecté</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Synchronisation temps réel avec le core-banking Carthago & la campagne Épargne Habitat.
          </p>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="border-t p-3 space-y-2">
        <Link
          href="/"
          className="flex h-7 w-full items-center justify-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Citizen Portal</span>
        </Link>

        <div className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-secondary/50 transition-colors">
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary text-primary-foreground">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col min-w-0">
            <span className="text-xs font-medium truncate leading-tight">Admin Officer</span>
            <span className="text-[11px] text-muted-foreground truncate">admin@cfc.cm</span>
          </div>
        </div>
      </div>
    </aside>
  );
}


