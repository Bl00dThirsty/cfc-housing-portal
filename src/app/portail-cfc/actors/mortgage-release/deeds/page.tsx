"use client";

import * as React from "react";
import { Search, Download, Eye } from "lucide-react";
import { ActorKpiStrip, type ActorKpiItem } from "@/components/admin/actor-kpi-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const deedsKpis: ActorKpiItem[] = [
  {
    title: "Actes Rédigés (Mois)",
    value: "28",
    change: "16.7%",
    isPositive: true,
    previous: "24 actes",
    period: "ce mois",
  },
  {
    title: "Signatures DG Obtenues",
    value: "22",
    change: "22.2%",
    isPositive: true,
    previous: "18 actes",
    period: "paraphes Direction Générale",
  },
  {
    title: "Délai Rédaction Acte",
    value: "3.1 jours",
    change: "16.2%",
    isPositive: true,
    previous: "3.7 jours",
    period: "cible ≤ 4j",
  },
  {
    title: "En Attente Signature Notaire",
    value: "6",
    change: "14.3%",
    isPositive: true,
    previous: "7 actes",
    period: "en étude notariale",
  },
  {
    title: "Actes Enregistrés Fisc",
    value: "19",
    change: "18.8%",
    isPositive: true,
    previous: "16 actes",
    period: "droits de mainlevée réglés",
  },
];

const deedsRecords = [
  {
    id: "mde1",
    ref: "MLV-2026-ACT-00128",
    client: "KAMGA Pascal",
    ducId: "CFC-2026-DUC-03890",
    landTitle: "TF N° 6120/Mfoundi",
    notaryOffice: "Étude Me Nkouendjin (Yaoundé)",
    initialLoan: "15 000 000 FCFA",
    status: "Signé DG & Notaire",
    signedDate: "02 Septembre 2026",
  },
  {
    id: "mde2",
    ref: "MLV-2026-ACT-00127",
    client: "TCHATCHOUANG Hélène",
    ducId: "CFC-2026-DUC-03912",
    landTitle: "TF N° 9415/Wouri",
    notaryOffice: "Étude Me Douala Manga (Douala)",
    initialLoan: "28 000 000 FCFA",
    status: "Transmis Enregistrement",
    signedDate: "01 Septembre 2026",
  },
  {
    id: "mde3",
    ref: "MLV-2026-ACT-00126",
    client: "MVONDO Albert",
    ducId: "CFC-2026-DUC-03945",
    landTitle: "TF N° 2840/Méfou-et-Afamba",
    notaryOffice: "Étude Me Bisseck (Kribi)",
    initialLoan: "12 000 000 FCFA",
    status: "En attente signature DG",
    signedDate: "Projet validé 03/09",
  },
  {
    id: "mde4",
    ref: "MLV-2026-ACT-00125",
    client: "FOUDA Bernadette",
    ducId: "CFC-2026-DUC-03980",
    landTitle: "TF N° 5510/Nyong-et-So'o",
    notaryOffice: "Étude Me Kamdem (Bafoussam)",
    initialLoan: "9 500 000 FCFA",
    status: "En attente signature Notaire",
    signedDate: "Transmis le 28/08",
  },
  {
    id: "mde5",
    ref: "MLV-2026-ACT-00124",
    client: "BASSOMGBEN Jean",
    ducId: "CFC-2025-DUC-03410",
    landTitle: "TF N° 4118/Sanaga-Maritime",
    notaryOffice: "Étude Me Fotso (Edéa)",
    initialLoan: "18 000 000 FCFA",
    status: "Signé DG & Notaire",
    signedDate: "25 Août 2026",
  },
  {
    id: "mde6",
    ref: "MLV-2026-ACT-00123",
    client: "NGUEMO Paul",
    ducId: "CFC-2025-DUC-03150",
    landTitle: "TF N° 8210/Menoua",
    notaryOffice: "Étude Me Kamdem (Dschang)",
    initialLoan: "14 000 000 FCFA",
    status: "Transmis Enregistrement",
    signedDate: "22 Août 2026",
  },
];

const deedStatusStyles: Record<string, string> = {
  "Signé DG & Notaire": "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Transmis Enregistrement": "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "En attente signature DG": "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "En attente signature Notaire": "bg-purple-500/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
};

export default function MortgageDeedsPage() {
  const [search, setSearch] = React.useState("");

  const filtered = deedsRecords.filter(
    (d) =>
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.ref.toLowerCase().includes(search.toLowerCase()) ||
      d.ducId.toLowerCase().includes(search.toLowerCase()) ||
      d.landTitle.toLowerCase().includes(search.toLowerCase()) ||
      d.notaryOffice.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-semibold h-5 px-2">
              Groupe G4
            </Badge>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-transparent h-5 px-2 text-xs font-medium">
              Actes de Mainlevée Notariée
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Actes de Mainlevée d&apos;Hypothèque Notariée
          </h1>
          <p className="text-sm text-muted-foreground">
            Établissement des projets d&apos;actes authentiques de mainlevée totale d&apos;hypothèque, signature de la Direction Générale et transmission aux études notariales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Download className="size-3.5" />
            Export Registre Actes
          </Button>
        </div>
      </div>

      {/* KPI Strip (NO ICONS) */}
      <ActorKpiStrip items={deedsKpis} />

      {/* Table Section */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Rechercher par acte, emprunteur, Titre Foncier ou notaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Mainlevée totale et définitive après constatation du solde nul par la DFBC</span>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-foreground px-3">Réf. Mainlevée</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Bénéficiaire de la Mainlevée</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Identifiant DUC</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Titre Foncier (TF)</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Étude Notariale</TableHead>
                <TableHead className="text-xs font-medium text-foreground text-right px-3">Prêt Garanti</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Statut de l&apos;Acte</TableHead>
                <TableHead className="text-xs font-medium text-foreground px-3">Date Signature</TableHead>
                <TableHead className="w-12 text-right pr-4 text-xs font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-muted/30 h-5 px-2">
                      {item.ref}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-800">
                          {getInitials(item.client)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-xs text-foreground truncate">{item.client}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{item.ducId}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="secondary" className="font-mono text-xs font-medium h-5 px-2 bg-slate-500/10 text-slate-800 dark:text-slate-200 border-transparent">
                      {item.landTitle}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-foreground max-w-[180px]">
                    <span className="truncate block">{item.notaryOffice}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right font-mono font-semibold text-xs text-foreground whitespace-nowrap">
                    {item.initialLoan}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`${deedStatusStyles[item.status] ?? ""} h-5 px-2 text-xs font-medium border-transparent whitespace-nowrap`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {item.signedDate}
                  </TableCell>
                  <TableCell className="text-right pr-4 py-2.5">
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
