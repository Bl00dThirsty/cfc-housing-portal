import { Check, CircleDashed, Clock, TriangleAlert } from "lucide-react";

import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
// Import de types uniquement : effacé à la compilation, aucun lien d'exécution
// avec la couche serveur (le contrat de la couture impose l'alias pour les
// valeurs, pas pour les types).
import type { ChecklistItem, ChecklistStatus } from "../../server/queries/dossiers";

type DossierRequirementsProps = {
  checklist: ChecklistItem[];
  uploadedCount: number;
  requiredCount: number;
};

const STATUS_META: Record<
  ChecklistStatus,
  { label: string; tone: "green" | "blue" | "amber" | "red" | "neutral"; icon: typeof Check }
> = {
  verified: { label: "Validé", tone: "green", icon: Check },
  uploaded: { label: "Déposé", tone: "blue", icon: Clock },
  in_review: { label: "En revue", tone: "amber", icon: Clock },
  rejected: { label: "Rejeté", tone: "red", icon: TriangleAlert },
  missing: { label: "À fournir", tone: "neutral", icon: CircleDashed },
};

export function DossierRequirements({
  checklist,
  uploadedCount,
  requiredCount,
}: DossierRequirementsProps) {
  if (checklist.length === 0) {
    return (
      <div className="rounded-lg border border-line-strong bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Le catalogue documentaire de votre service n&apos;est pas encore
          publié. Il sera affiché ici dès que la Direction Générale l&apos;aura
          paramétré.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-strong bg-card px-4 py-3">
        <div className="flex flex-col">
          <span className="eyebrow-style font-normal text-subtle">
            Complétude du dossier
          </span>
          <span className="text-sm font-medium text-foreground">
            {uploadedCount} pièce(s) déposée(s) sur {checklist.length} attendues
          </span>
        </div>
        <Tag tone={uploadedCount >= requiredCount ? "green" : "amber"}>
          {uploadedCount >= requiredCount
            ? "Dossier complet"
            : `${requiredCount - uploadedCount} pièce(s) manquante(s)`}
        </Tag>
      </div>

      <ul className="flex flex-col divide-y divide-line-strong rounded-lg border border-line-strong bg-card">
        {checklist.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;
          return (
            <li
              key={`${item.stage}-${item.docTypeCode}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <Icon
                  aria-hidden
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0",
                    item.status === "verified" && "text-success",
                    item.status === "missing" && "text-soft",
                    item.status === "rejected" && "text-destructive",
                    item.status === "uploaded" && "text-muted-foreground",
                    item.status === "in_review" && "text-warning",
                  )}
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-foreground">{item.label}</span>
                  <span className="truncate caption-style text-soft">
                    {item.natureLabel}
                    {item.issuingAuthority ? ` · ${item.issuingAuthority}` : ""} ·{" "}
                    {item.stageLabel}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {item.required && (
                  <Tag tone="neutral" size="sm">
                    Obligatoire
                  </Tag>
                )}
                <Tag tone={meta.tone} size="sm">
                  {meta.label}
                </Tag>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
