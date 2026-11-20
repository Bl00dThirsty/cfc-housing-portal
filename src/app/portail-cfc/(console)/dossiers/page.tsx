import { PoleKpiStrip } from "@/components/portail-cfc/pole-kpi-strip";
import { DossierOrientationQueue } from "./_components/dossier-orientation-queue";

export const dynamic = "force-dynamic";

/**
 * La file des dossiers à orienter — l'écran d'atterrissage du conseiller.
 *
 * C'est le poste de travail de l'agent : les dossiers qui attendent une
 * décision, et les décisions elles-mêmes. Chaque décision est journalisée et
 * notifiée à l'emprunteur.
 */
export default function DossiersPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <span className="eyebrow-style font-normal text-cfc-gold">Portefeuille · Orientation</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dossiers à orienter
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Les dossiers qui attendent une décision : activation du dossier unique,
          refus motivé, ou demande d&apos;une pièce manquante. Chaque décision est
          journalisée et l&apos;emprunteur en est prévenu.
        </p>
      </div>

      <PoleKpiStrip />

      <div className="rounded-xl border border-line-strong bg-card p-4 shadow-xs">
        <DossierOrientationQueue />
      </div>
    </div>
  );
}
