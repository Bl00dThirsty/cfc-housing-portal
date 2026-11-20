"use client";

import * as React from "react";
import { AlertCircle, Check, CircleDashed, Clock, FileText } from "lucide-react";

import { DocumentUploader, type UploadedDocument } from "@/components/upload/document-uploader";
import type { ChecklistItem, ChecklistStatus } from "@/domain/entities/services";
import type { IndexedStep } from "@/domain/workflows/tracking";
import { formatBytes } from "@/components/upload/storage";

type DocumentDropzoneProps = {
  dossierId: string;
  ducId: string;
  checklist: ChecklistItem[];
  steps: IndexedStep[];
};

const STATUS_META: Record<
  ChecklistStatus,
  { label: string; icon: typeof Check; className: string }
> = {
  missing: {
    label: "À fournir",
    icon: CircleDashed,
    className: "bg-slate-100 text-slate-600",
  },
  deja_fournie: {
    label: "Déjà fournie",
    icon: Check,
    className: "bg-emerald-100 text-emerald-800",
  },
  envoyee: {
    label: "Transmise",
    icon: Clock,
    className: "bg-blue-100 text-blue-800",
  },
  uploaded: {
    label: "Déposée — en revue",
    icon: Clock,
    className: "bg-amber-100 text-amber-800",
  },
  in_review: {
    label: "En cours de revue",
    icon: Clock,
    className: "bg-amber-100 text-amber-800",
  },
  verified: {
    label: "Validée",
    icon: Check,
    className: "bg-emerald-100 text-emerald-800",
  },
  rejected: {
    label: "À corriger",
    icon: AlertCircle,
    className: "bg-rose-100 text-rose-800",
  },
};

export default function DocumentDropzone({
  dossierId,
  ducId,
  checklist,
  steps,
}: DocumentDropzoneProps) {
  const [newUploads, setNewUploads] = React.useState<Record<string, UploadedDocument>>({});

  const handleUploaded = React.useCallback(
    (docTypeCode: string, document: UploadedDocument) => {
      setNewUploads((current) => ({ ...current, [docTypeCode]: document }));
    },
    [],
  );

  const requiredItems = checklist.filter((item) => item.required);
  const completedRequired = requiredItems.filter((item) => {
    const status = newUploads[item.docTypeCode] ? "uploaded" : item.status;
    return status !== "missing" && status !== "rejected";
  }).length;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Dossier citoyen</p>
            <h2 className="text-lg font-semibold text-foreground">{ducId}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {completedRequired} / {requiredItems.length} pièces obligatoires transmises
          </p>
        </div>
      </section>

      <section aria-labelledby="citizen-documents-heading" className="space-y-3">
        <div>
          <h3 id="citizen-documents-heading" className="text-base font-semibold">
            Pièces demandées
          </h3>
          <p className="text-sm text-muted-foreground">
            La liste et les statuts proviennent du catalogue et du dossier CFC.
          </p>
        </div>

        {checklist.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Le catalogue documentaire de ce service n&apos;est pas encore disponible.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {checklist.map((item) => {
              const localUpload = newUploads[item.docTypeCode];
              const status = localUpload ? "uploaded" : item.status;
              const meta = STATUS_META[status];
              const Icon = meta.icon;
              const mayUpload = status === "missing" || status === "rejected";

              return (
                <article key={`${item.stage}-${item.docTypeCode}`} className="space-y-3 rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium">{item.label}</h4>
                        <p className="text-xs text-muted-foreground">
                          {item.natureLabel}
                          {item.issuingAuthority ? ` · ${item.issuingAuthority}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${meta.className}`}>
                      <Icon className="size-3" aria-hidden />
                      {meta.label}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {item.stageLabel}
                    {item.required ? " · Obligatoire" : " · Facultative"}
                  </p>

                  {localUpload ? (
                    <p className="truncate rounded-md bg-muted/50 px-3 py-2 text-xs">
                      {localUpload.filename} · {formatBytes(localUpload.sizeBytes)}
                    </p>
                  ) : item.uploadedAt ? (
                    <p className="text-xs text-muted-foreground">
                      Déposée le {new Date(item.uploadedAt).toLocaleDateString("fr-FR")}
                    </p>
                  ) : null}

                  {mayUpload ? (
                    <DocumentUploader
                      dossierId={dossierId}
                      docTypeCode={item.docTypeCode}
                      chemiseCode="C1"
                      label={status === "rejected" ? "Remplacer la pièce" : "Déposer cette pièce"}
                      hint={`${item.label} — PDF, JPEG ou PNG`}
                      onUploaded={(document) => handleUploaded(item.docTypeCode, document)}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="citizen-progress-heading" className="space-y-3">
        <div>
          <h3 id="citizen-progress-heading" className="text-base font-semibold">
            Avancement du dossier
          </h3>
          <p className="text-sm text-muted-foreground">
            Les étapes reflètent l&apos;état courant et les événements enregistrés.
          </p>
        </div>

        {steps.length === 0 ? (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            Aucune étape de traitement n&apos;est encore enregistrée.
          </p>
        ) : (
          <ol className="space-y-2">
            {steps.map((step) => (
              <li
                key={step.code}
                className="flex items-start gap-3 rounded-lg border bg-card p-3"
              >
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    step.status === "done"
                      ? "bg-emerald-100 text-emerald-800"
                      : step.status === "current"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-muted text-muted-foreground"
                  }`}
                  aria-label={
                    step.status === "done"
                      ? "Terminée"
                      : step.status === "current"
                        ? "En cours"
                        : "À venir"
                  }
                >
                  {step.status === "done" ? <Check className="size-3.5" aria-hidden /> : step.code}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.phaseLabel} · {step.status === "done" ? "Terminée" : step.status === "current" ? "En cours" : "À venir"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
