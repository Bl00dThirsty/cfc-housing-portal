"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Send, Save, ToggleLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { renderTemplate } from "@/server/email/render";
import {
  sendEmailAction,
  toggleEmailTemplateAction,
  upsertEmailTemplateAction,
} from "@/server/email/actions";
import type { EmailTemplateContent } from "@/server/email/types";

/**
 * Éditeur de modèle d'e-mail.
 *
 * L'aperçu est rendu **par le moteur réel** (`renderTemplate`) : ce qui est
 * affiché ici est exactement ce qui partira au destinataire, y compris
 * l'échappement des valeurs.
 *
 * La sauvegarde ne modifie **jamais** le modèle en place : elle publie une
 * version nouvelle et ferme la précédente.
 */

/** Valeurs d'exemple proposées pour l'aperçu. */
const SAMPLE_VALUES: Record<string, string> = {
  prenom: "Awa",
  nom: "Njoya",
  email: "awa.njoya@example.cm",
  telephone: "+237 6 99 00 00 00",
  duc: "CFC-2026-DUC-04829",
  reference: "DUC-2026-04829",
  date: "12 mars 2026",
  lien: "https://cfc.cm/portail-client",
  montant: "5 000 000 FCFA",
  taux: "6,5 %",
  echeance: "145 000 FCFA",
  duree: "30 minutes",
  motif: "Photocopie de la CNI illisible — une version lisible est requise.",
  document: "Photocopie de la CNI biométrique",
  decision: "Accord sous réserve de la production des pièces définitives",
};

/** Valeur d'exemple pour une variable inconnue du dictionnaire. */
function sampleFor(name: string): string {
  return SAMPLE_VALUES[name] ?? `« ${name} »`;
}

interface EmailTemplateEditorProps {
  /** Modèle courant. */
  template: EmailTemplateContent;
  /** Historique des versions (la plus récente en tête). */
  history: EmailTemplateContent[];
  /** `true` quand le catalogue est muet et que le modèle par défaut est servi. */
  isFallback: boolean;
}

/** Formate une date ISO en français. */
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function EmailTemplateEditor({
  template,
  history,
  isFallback,
}: EmailTemplateEditorProps) {
  const router = useRouter();

  const [label, setLabel] = useState(template.label);
  const [subject, setSubject] = useState(template.subject);
  const [html, setHtml] = useState(template.html);
  const [text, setText] = useState(template.text);
  const [variables, setVariables] = useState<string[]>(template.variables);
  const [variablesInput, setVariablesInput] = useState(template.variables.join(", "));
  const [samples, setSamples] = useState<Record<string, string>>({});
  const [showText, setShowText] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [busy, setBusy] = useState<"save" | "toggle" | "test" | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  /** Valeurs injectées dans l'aperçu. */
  const previewVariables = useMemo(() => {
    const map: Record<string, string> = {};
    for (const name of variables) {
      map[name] = samples[name] ?? sampleFor(name);
    }
    return map;
  }, [variables, samples]);

  /** Aperçu rendu par le moteur réel. */
  const preview = useMemo(
    () => renderTemplate({ subject, html, text, variables }, previewVariables),
    [subject, html, text, variables, previewVariables],
  );

  const handlePublish = async () => {
    setBusy("save");
    setFeedback(null);

    const result = await upsertEmailTemplateAction({
      code: template.code,
      label,
      subject,
      html,
      text,
      variables,
    });

    setBusy(null);
    setFeedback({ ok: result.ok, message: result.message });
    if (result.ok) router.refresh();
  };

  const handleToggle = async () => {
    setBusy("toggle");
    setFeedback(null);

    const result = await toggleEmailTemplateAction(template.code, !template.isActive);

    setBusy(null);
    setFeedback({ ok: result.ok, message: result.message });
    if (result.ok) router.refresh();
  };

  const handleTest = async () => {
    setBusy("test");
    setFeedback(null);

    const result = await sendEmailAction({
      templateCode: template.code,
      to: testRecipient,
      variables: previewVariables,
    });

    setBusy(null);
    setFeedback({
      ok: result.status === "sent",
      message:
        result.status === "sent"
          ? `Message envoyé à ${testRecipient}.`
          : `Envoi non abouti (${result.status}) : ${result.error ?? "cause inconnue."}`,
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-sm font-semibold text-foreground">{template.code}</h1>
            <Badge variant="secondary" className="text-[11px]">
              version {template.version}
            </Badge>
            {template.isActive ? (
              <Badge variant="success" className="text-[11px]">
                Actif
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-[11px]">
                Désactivé
              </Badge>
            )}
            {isFallback && (
              <Badge variant="outline" className="text-[11px]">
                Modèle par défaut
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Événement déclencheur : <span className="font-mono">{template.eventType}</span> — en
            vigueur depuis le {formatDate(template.effectiveFrom)}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={handleToggle}
          >
            <ToggleLeft className="size-3.5" />
            {template.isActive ? "Désactiver" : "Activer"}
          </Button>
          <Button type="button" size="sm" disabled={busy !== null} onClick={handlePublish}>
            <Save className="size-3.5" />
            {busy === "save" ? "Publication…" : "Publier une nouvelle version"}
          </Button>
        </div>
      </header>

      {feedback && (
        <div
          className={`rounded-md border px-3 py-2 text-xs ${
            feedback.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* --------------------------------------------------------------
            Édition
        -------------------------------------------------------------- */}
        <div className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-[13px]">Contenu du message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email-label">Intitulé interne</Label>
                <Input
                  id="email-label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  className="h-8 text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email-subject">Objet</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="h-8 font-mono text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email-html">Corps HTML</Label>
                <Textarea
                  id="email-html"
                  value={html}
                  onChange={(event) => setHtml(event.target.value)}
                  className="min-h-[220px] font-mono text-[12px] leading-relaxed"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email-text">Corps texte (alternative)</Label>
                <Textarea
                  id="email-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="min-h-[140px] font-mono text-[12px] leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-[13px]">Variables acceptées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email-variables">Liste (séparée par des virgules)</Label>
                <Input
                  id="email-variables"
                  value={variablesInput}
                  onChange={(event) => {
                    setVariablesInput(event.target.value);
                    setVariables(
                      event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    );
                  }}
                  className="h-8 font-mono text-[12px]"
                />
              </div>

              {variables.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {variables.map((name) => (
                    <div key={name} className="space-y-1">
                      <Label
                        htmlFor={`sample-${name}`}
                        className="font-mono text-[11px] text-muted-foreground"
                      >
                        {name}
                      </Label>
                      <Input
                        id={`sample-${name}`}
                        value={samples[name] ?? sampleFor(name)}
                        onChange={(event) =>
                          setSamples((current) => ({ ...current, [name]: event.target.value }))
                        }
                        className="h-8 text-[12px]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Ce modèle n&apos;accepte aucune variable.
                </p>
              )}

              {preview.missing.length > 0 && (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-300">
                  Variables manquantes : {preview.missing.join(", ")}. Le message ne partira pas
                  tant qu&apos;elles ne sont pas renseignées.
                </p>
              )}

              {preview.undeclared.length > 0 && (
                <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
                  Variables utilisées mais non déclarées : {preview.undeclared.join(", ")}.
                </p>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-[13px]">Envoi d&apos;un test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                value={testRecipient}
                onChange={(event) => setTestRecipient(event.target.value)}
                placeholder="adresse.de.test@cfc.cm"
                className="h-8 text-[13px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy !== null || testRecipient.trim() === ""}
                onClick={handleTest}
              >
                <Send className="size-3.5" />
                {busy === "test" ? "Envoi…" : "Envoyer un test"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Sans configuration de messagerie, l&apos;envoi est journalisé « skipped » : il
                n&apos;échoue pas.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --------------------------------------------------------------
            Aperçu
        -------------------------------------------------------------- */}
        <div className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-1.5 text-[13px]">
                  <Eye className="size-3.5" />
                  Aperçu
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={showText ? "ghost" : "secondary"}
                    size="xs"
                    onClick={() => setShowText(false)}
                  >
                    HTML
                  </Button>
                  <Button
                    type="button"
                    variant={showText ? "secondary" : "ghost"}
                    size="xs"
                    onClick={() => setShowText(true)}
                  >
                    Texte
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Objet : <span className="text-foreground">{preview.subject || "—"}</span>
              </p>

              {showText ? (
                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 font-mono text-[12px] leading-relaxed text-foreground">
                  {preview.text}
                </pre>
              ) : (
                <iframe
                  title={`Aperçu du modèle ${template.code}`}
                  srcDoc={preview.html}
                  sandbox=""
                  className="h-[520px] w-full rounded-md border border-border bg-white"
                />
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-[13px]">Historique des versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {history.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucune version enregistrée : la publication ci-dessus créera la version 1.
                </p>
              )}

              {history.map((item) => (
                <div
                  key={item.version}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-[12px]"
                >
                  <span className="font-mono font-medium text-foreground">v{item.version}</span>
                  <span className="flex-1 truncate text-muted-foreground">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(item.effectiveFrom)}
                    {item.effectiveTo ? ` → ${formatDate(item.effectiveTo)}` : ""}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
