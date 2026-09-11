import { Ellipsis } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const pages = [
  { bounce: "18%", path: "/ (Vitrine Campagne Épargne)", time: "3m 45s", views: "148.2k" },
  { bounce: "22%", path: "/simulator (Simulateur d'Emprunt)", time: "4m 12s", views: "84.6k" },
  { bounce: "15%", path: "/onboarding (Création Compte DUC)", time: "5m 30s", views: "34.8k" },
  { bounce: "12%", path: "/portal (Guichet Unique Citoyen)", time: "6m 18s", views: "28.4k" },
  { bounce: "35%", path: "/portal/depot-pieces (Téléversement)", time: "2m 50s", views: "14.2k" },
];

export function TopPages() {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal text-base">Performance des Pages Clés (Vitrine & Portail)</CardTitle>
        <CardAction>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            aria-label="Options"
          >
            <Ellipsis className="size-4" />
          </button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8">Route / Page</TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">Visites</TableHead>
              <TableHead className="h-8 w-28 text-right font-normal">Temps Moyen</TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">Rebond</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {pages.map((page) => (
              <TableRow className="hover:bg-muted/40 transition-colors" key={page.path}>
                <TableCell className="max-w-0 truncate py-3.5 font-medium text-xs">{page.path}</TableCell>
                <TableCell className="text-right tabular-nums text-xs font-semibold">{page.views}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums text-xs">{page.time}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums text-xs">{page.bounce}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
