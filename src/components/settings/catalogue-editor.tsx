"use client";

import * as React from "react";
import { Check, Loader2, Pencil, Plus, Save, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  deleteRequirementAction,
  listCatalogueAction,
  upsertDocumentTypeAction,
  upsertNatureAction,
  upsertRequirementAction,
  upsertServiceAction,
  type CatalogueSnapshot,
} from "@/server/actions/catalogue";

const STAGES = [
  { value: "ONBOARDING", label: "À l'inscription" },
  { value: "SAVINGS", label: "Pendant l'épargne" },
  { value: "CREDIT_FILE", label: "Dossier de crédit" },
  { value: "NOTARY", label: "Notaire" },
  { value: "MORTGAGE", label: "Hypothèque" },
  { value: "DISBURSEMENT", label: "Déblocage" },
  { value: "PAYOFF", label: "Apurement" },
] as const;

type TabId = "services" | "natures" | "documents" | "requirements";

export function CatalogueEditor() {
  const [snapshot, setSnapshot] = React.useState<CatalogueSnapshot | null>(null);
  const [tab, setTab] = React.useState<TabId>("documents");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const refresh = React.useCallback(() => {
    void listCatalogueAction().then((result) => {
      if (result.ok) {
        setSnapshot(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "L'opération a échoué.");
        return;
      }
      refresh();
    });
  };

  if (!snapshot) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Chargement du catalogue…
      </div>
    );
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "documents", label: "Pièces", count: snapshot.documentTypes.length },
    { id: "requirements", label: "Exigences", count: snapshot.requirements.length },
    { id: "services", label: "Services", count: snapshot.services.length },
    { id: "natures", label: "Natures", count: snapshot.natures.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Sections du catalogue"
        className="flex flex-wrap items-center gap-1 border-b border-line-strong"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors duration-200 ease-power3-out",
              tab === item.id
                ? "border-cfc-brown font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive">
          {error}
        </p>
      )}

      {tab === "documents" && <DocumentTypesTab snapshot={snapshot} run={run} pending={pending} />}
      {tab === "requirements" && <RequirementsTab snapshot={snapshot} run={run} pending={pending} />}
      {tab === "services" && <ServicesTab snapshot={snapshot} run={run} pending={pending} />}
      {tab === "natures" && <NaturesTab snapshot={snapshot} run={run} pending={pending} />}
    </div>
  );
}

type RunFn = (action: () => Promise<{ ok: boolean; error?: string }>) => void;

type TabProps = {
  snapshot: CatalogueSnapshot;
  run: RunFn;
  pending: boolean;
};

function DocumentTypesTab({ snapshot, run, pending }: TabProps) {
  const [editing, setEditing] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <p className="caption-style text-muted-foreground">
        Une pièce déclare sa nature, son émetteur, sa durée de validité et les
        formats acceptés. Toute modification s&apos;applique immédiatement aux
        nouveaux dossiers.
      </p>

      <ul className="flex flex-col divide-y divide-line-strong rounded-md border border-line-strong">
        {snapshot.documentTypes.map((doc) => (
          <li key={doc.code} className="px-3 py-2.5">
            {editing === doc.code ? (
              <DocumentTypeForm
                doc={doc}
                natures={snapshot.natures}
                pending={pending}
                onCancel={() => setEditing(null)}
                onSave={(values) =>
                  run(async () => {
                    const result = await upsertDocumentTypeAction(values);
                    if (result.ok) setEditing(null);
                    return result;
                  })
                }
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {doc.label}
                  </span>
                  <span className="truncate caption-style text-soft">
                    {doc.code} · {doc.nature_code}
                    {doc.issuing_authority ? ` · ${doc.issuing_authority}` : ""}
                    {doc.validity_months ? ` · valable ${doc.validity_months} mois` : ""}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditing(doc.code)}
                  aria-label={`Modifier ${doc.label}`}
                >
                  <Pencil className="size-3.5" aria-hidden />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

type DocumentTypeValues = {
  code: string;
  label: string;
  nature_code: string;
  issuing_authority: string | null;
  validity_months: number | null;
  max_size_bytes: number;
  min_count: number;
  max_count: number | null;
};

function DocumentTypeForm({
  doc,
  natures,
  pending,
  onSave,
  onCancel,
}: {
  doc: DocumentTypeValues;
  natures: CatalogueSnapshot["natures"];
  pending: boolean;
  onSave: (values: DocumentTypeValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = React.useState<DocumentTypeValues>(doc);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Intitulé" id={`dt-label-${doc.code}`}>
          <Input
            id={`dt-label-${doc.code}`}
            value={values.label}
            onChange={(event) => setValues({ ...values, label: event.target.value })}
          />
        </Field>
        <Field label="Nature" id={`dt-nature-${doc.code}`}>
          <select
            id={`dt-nature-${doc.code}`}
            value={values.nature_code}
            onChange={(event) => setValues({ ...values, nature_code: event.target.value })}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {natures.map((nature) => (
              <option key={nature.code} value={nature.code}>
                {nature.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Émetteur" id={`dt-issuer-${doc.code}`}>
          <Input
            id={`dt-issuer-${doc.code}`}
            value={values.issuing_authority ?? ""}
            onChange={(event) =>
              setValues({ ...values, issuing_authority: event.target.value })
            }
            placeholder="DGSN, MINDCAF, Notaire…"
          />
        </Field>
        <Field label="Validité (mois)" id={`dt-validity-${doc.code}`}>
          <Input
            id={`dt-validity-${doc.code}`}
            type="number"
            min={0}
            value={values.validity_months ?? ""}
            onChange={(event) =>
              setValues({
                ...values,
                validity_months: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
        </Field>
        <Field label="Taille max (octets)" id={`dt-size-${doc.code}`}>
          <Input
            id={`dt-size-${doc.code}`}
            type="number"
            min={1024}
            step={1024}
            value={values.max_size_bytes}
            onChange={(event) =>
              setValues({ ...values, max_size_bytes: Number(event.target.value) })
            }
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min." id={`dt-min-${doc.code}`}>
            <Input
              id={`dt-min-${doc.code}`}
              type="number"
              min={1}
              value={values.min_count}
              onChange={(event) =>
                setValues({ ...values, min_count: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Max." id={`dt-max-${doc.code}`}>
            <Input
              id={`dt-max-${doc.code}`}
              type="number"
              min={0}
              value={values.max_count ?? ""}
              onChange={(event) =>
                setValues({
                  ...values,
                  max_count: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          <X className="size-3.5" aria-hidden />
          Annuler
        </Button>
        <Button
          variant="cfc"
          size="sm"
          disabled={pending}
          onClick={() => onSave(values)}
          className="gap-1.5 text-xs"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Save className="size-3.5" aria-hidden />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function RequirementsTab({ snapshot, run, pending }: TabProps) {
  const [serviceCode, setServiceCode] = React.useState(
    snapshot.services[0]?.code ?? "",
  );
  const [stage, setStage] = React.useState<string>("ONBOARDING");

  const live = snapshot.requirements.filter(
    (requirement) =>
      requirement.service_code === serviceCode &&
      requirement.stage === stage &&
      requirement.effective_to === null,
  );
  const liveCodes = new Set(live.map((requirement) => requirement.doc_type_code));

  return (
    <div className="flex flex-col gap-3">
      <p className="caption-style text-muted-foreground">        Une exigence est <strong>versionnée par date d&apos;effet</strong> :
        la modifier ferme la règle en vigueur et en ouvre une nouvelle. Les
        dossiers en cours restent donc auditables sous la règle qui leur
        était applicable.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Service" id="req-service">
          <select
            id="req-service"
            value={serviceCode}
            onChange={(event) => setServiceCode(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {snapshot.services.map((service) => (
              <option key={service.code} value={service.code}>
                {service.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Étape" id="req-stage">
          <select
            id="req-stage"
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {STAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <ul className="flex flex-col divide-y divide-line-strong rounded-md border border-line-strong">
        {snapshot.documentTypes.map((doc) => {
          const requirement = live.find((item) => item.doc_type_code === doc.code);
          return (
            <li
              key={doc.code}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-foreground">{doc.label}</span>
                <span className="truncate caption-style text-soft">{doc.nature_code}</span>
              </div>
              {requirement ? (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={requirement.required ? "cfc" : "secondary"}
                    className="h-4 px-1.5 text-[10px]"
                  >
                    {requirement.required ? "Obligatoire" : "Facultatif"} · min{" "}
                    {requirement.min_count}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        deleteRequirementAction({
                          service_code: serviceCode,
                          stage,
                          doc_type_code: doc.code,
                        }),
                      )
                    }
                    className="h-6 px-2 text-[11px] text-destructive"
                  >
                    Retirer
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      upsertRequirementAction({
                        service_code: serviceCode,
                        stage,
                        doc_type_code: doc.code,
                        required: true,
                        min_count: 1,
                        max_count: null,
                      }),
                    )
                  }
                  className="h-6 gap-1 px-2 text-[11px]"
                >
                  <Plus className="size-3" aria-hidden />
                  Exiger
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {liveCodes.size === 0 && (
        <p className="caption-style text-soft">
          Aucune pièce exigée à cette étape pour ce service.
        </p>
      )}
    </div>
  );
}

function ServicesTab({ snapshot, run, pending }: TabProps) {
  const [editing, setEditing] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-line-strong rounded-md border border-line-strong">
        {snapshot.services.map((service) => (
          <li key={service.code} className="px-3 py-2.5">
            {editing === service.code ? (
              <ServiceForm
                service={service}
                pending={pending}
                onCancel={() => setEditing(null)}
                onSave={(values) =>
                  run(async () => {
                    const result = await upsertServiceAction(values);
                    if (result.ok) setEditing(null);
                    return result;
                  })
                }
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {service.label}
                  </span>
                  <span className="truncate caption-style text-soft">{service.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={service.is_active ? "success" : "secondary"}
                    className="h-4 px-1.5 text-[10px]"
                  >
                    {service.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditing(service.code)}
                    aria-label={`Modifier ${service.label}`}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServiceForm({
  service,
  pending,
  onSave,
  onCancel,
}: {
  service: { code: string; label: string; description: string | null; is_active: boolean };
  pending: boolean;
  onSave: (values: {
    code: string;
    label: string;
    description: string;
    is_active: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = React.useState({
    code: service.code,
    label: service.label,
    description: service.description ?? "",
    is_active: service.is_active,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Intitulé" id={`svc-label-${service.code}`}>
          <Input
            id={`svc-label-${service.code}`}
            value={values.label}
            onChange={(event) => setValues({ ...values, label: event.target.value })}
          />
        </Field>
        <Field label="Description" id={`svc-desc-${service.code}`}>
          <Input
            id={`svc-desc-${service.code}`}
            value={values.description}
            onChange={(event) =>
              setValues({ ...values, description: event.target.value })
            }
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={values.is_active}
          onChange={(event) => setValues({ ...values, is_active: event.target.checked })}
          className="size-3.5 accent-cfc-brown"
        />
        Service actif (proposé aux emprunteurs)
      </label>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          <X className="size-3.5" aria-hidden />
          Annuler
        </Button>
        <Button
          variant="cfc"
          size="sm"
          disabled={pending}
          onClick={() => onSave(values)}
          className="gap-1.5 text-xs"
        >
          <Check className="size-3.5" aria-hidden />
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function NaturesTab({ snapshot, run, pending }: TabProps) {
  const [editing, setEditing] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-line-strong rounded-md border border-line-strong">
        {snapshot.natures.map((nature) => (
          <li key={nature.code} className="flex items-center justify-between gap-3 px-3 py-2">
            {editing === nature.code ? (
              <NatureForm
                nature={nature}
                pending={pending}
                onCancel={() => setEditing(null)}
                onSave={(values) =>
                  run(async () => {
                    const result = await upsertNatureAction(values);
                    if (result.ok) setEditing(null);
                    return result;
                  })
                }
              />
            ) : (
              <>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-foreground">{nature.label}</span>
                  <span className="truncate caption-style text-soft">{nature.code}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditing(nature.code)}
                  aria-label={`Modifier ${nature.label}`}
                >
                  <Pencil className="size-3.5" aria-hidden />
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NatureForm({
  nature,
  pending,
  onSave,
  onCancel,
}: {
  nature: { code: string; label: string; description: string | null };
  pending: boolean;
  onSave: (values: { code: string; label: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = React.useState({
    code: nature.code,
    label: nature.label,
    description: nature.description ?? "",
  });

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Intitulé" id={`nature-label-${nature.code}`}>
          <Input
            id={`nature-label-${nature.code}`}
            value={values.label}
            onChange={(event) => setValues({ ...values, label: event.target.value })}
          />
        </Field>
        <Field label="Description" id={`nature-desc-${nature.code}`}>
          <Input
            id={`nature-desc-${nature.code}`}
            value={values.description}
            onChange={(event) =>
              setValues({ ...values, description: event.target.value })
            }
          />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          <X className="size-3.5" aria-hidden />
          Annuler
        </Button>
        <Button
          variant="cfc"
          size="sm"
          disabled={pending}
          onClick={() => onSave(values)}
          className="gap-1.5 text-xs"
        >
          <Check className="size-3.5" aria-hidden />
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="eyebrow-style font-normal text-subtle">
        {label}
      </label>
      {children}
    </div>
  );
}
