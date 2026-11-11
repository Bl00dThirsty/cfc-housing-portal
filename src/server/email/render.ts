/**
 * Moteur de rendu des modèles d'e-mail.
 *
 * Trois responsabilités, toutes testables sans base ni réseau :
 *
 * 1. **Substitution** des `{{variables}}`.
 * 2. **Échappement HTML** des valeurs substituées : un nom qui contient
 *    `<script>` ne doit jamais pouvoir injecter de balise. C'est la seule
 *    barrière entre une donnée saisie par un citoyen et le corps HTML du
 *    message.
 * 3. **Détection des variables manquantes** : un modèle ne part pas avec un
 *    trou silencieux, il est signalé.
 *
 * Ce module est **pur** : aucun import React, Supabase ou Node.
 */

import type { EmailVariables } from "./types";

/** Motif des variables : `{{nom}}`, espaces internes tolérés. */
const PLACEHOLDER_SOURCE = "\\{\\{\\s*([A-Za-z0-9_]+)\\s*\\}\\}";

/** Motif des variables, en lecture seule. */
export const PLACEHOLDER_PATTERN = new RegExp(PLACEHOLDER_SOURCE, "g");

/** Instance neuve du motif — `replace` sur un motif global conserve un état. */
function placeholderRegex(): RegExp {
  return new RegExp(PLACEHOLDER_SOURCE, "g");
}

/**
 * Erreur levée quand une variable requise est absente.
 *
 * Le pipeline d'envoi la rattrape et la transforme en livraison `failed` :
 * une donnée manquante ne doit pas faire tomber l'opération métier.
 */
export class MissingVariableError extends Error {
  /** Variables attendues et absentes. */
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Variables manquantes : ${missing.join(", ")}`);
    this.name = "MissingVariableError";
    this.missing = missing;
  }
}

/**
 * Échappe une valeur destinée au corps HTML.
 *
 * `&` d'abord, sinon les entités produites par la suite seraient
 * double-échappées. Les guillemets sont traités : une variable utilisée
 * dans un attribut (`href="{{lien}}"`) ne doit pas pouvoir refermer
 * l'attribut.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Liste des variables citées par un texte, sans doublon, dans l'ordre. */
export function extractPlaceholders(template: string): string[] {
  const found: string[] = [];
  for (const match of template.matchAll(placeholderRegex())) {
    const name = match[1];
    if (name && !found.includes(name)) found.push(name);
  }
  return found;
}

/** Normalise une valeur de variable en chaîne. */
function stringify(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

/**
 * Neutralise une valeur destinée à un **en-tête** (l'objet du message).
 *
 * Un retour à la ligne dans l'objet permettrait d'injecter un en-tête
 * supplémentaire (`Bcc:`) : les CR/LF sont donc remplacés par une espace.
 */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

/**
 * Neutralise une valeur destinée au **corps texte**.
 *
 * Les caractères de contrôle sont retirés (hors tabulation et saut de ligne) ;
 * le texte reste en revanche rendu tel quel — un corps `text/plain` n'est pas
 * interprété comme du balisage.
 */
function textSafe(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

/** Modèle exploitable par le moteur de rendu. */
export interface RenderableTemplate {
  subject: string;
  html: string;
  text: string;
  /** Variables déclarées par le modèle (contrat de l'éditeur). */
  variables?: readonly string[];
}

/** Résultat du rendu. */
export interface RenderedEmail {
  /** Objet rendu, sans retour à la ligne. */
  subject: string;
  /** Corps HTML rendu, valeurs échappées. */
  html: string;
  /** Corps texte rendu. */
  text: string;
  /** Variables attendues par le corps et absentes de la map. */
  missing: string[];
  /** Variables utilisées par le corps mais non déclarées dans `variables`. */
  undeclared: string[];
}

/**
 * Rend un modèle.
 *
 * Les variables **déclarées** (`template.variables`) constituent le contrat
 * affiché dans l'éditeur ; les variables **réellement citées** par le corps
 * font foi pour l'exigibilité. Une variable citée mais non déclarée est
 * signalée (`undeclared`) sans bloquer l'envoi.
 */
export function renderTemplate(
  template: RenderableTemplate,
  variables: EmailVariables,
): RenderedEmail {
  const used = [
    ...extractPlaceholders(template.subject),
    ...extractPlaceholders(template.html),
    ...extractPlaceholders(template.text),
  ].filter((name, index, all) => all.indexOf(name) === index);

  const declared = new Set(template.variables ?? []);

  const missing = used.filter((name) => {
    const value = variables[name];
    if (value === undefined || value === null) return true;
    return stringify(value).trim() === "";
  });

  const undeclared = used.filter((name) => !declared.has(name));

  const substitute = (source: string, escape: (value: string) => string): string =>
    source.replace(placeholderRegex(), (_match, name: string) => {
      const value = variables[name];
      if (value === undefined || value === null) return "";
      return escape(stringify(value));
    });

  return {
    subject: headerSafe(substitute(template.subject, (value) => value)),
    html: substitute(template.html, escapeHtml),
    text: textSafe(substitute(template.text, (value) => value)),
    missing,
    undeclared,
  };
}

/**
 * Rend un modèle et **lève** si une variable requise est absente.
 *
 * Réservé aux chemins qui ne tolèrent pas un message incomplet (l'éditeur
 * signale l'erreur ; le pipeline d'envoi, lui, journalise un échec).
 */
export function renderTemplateOrThrow(
  template: RenderableTemplate,
  variables: EmailVariables,
): RenderedEmail {
  const rendered = renderTemplate(template, variables);
  if (rendered.missing.length > 0) {
    throw new MissingVariableError(rendered.missing);
  }
  return rendered;
}

/**
 * Construit une map de variables à partir d'un couple `{ nom: valeur }`.
 *
 * Les valeurs `null` / `undefined` sont conservées telles quelles : c'est le
 * moteur de rendu qui décide si elles sont manquantes.
 */
export function toVariables(input: Record<string, unknown> | null | undefined): EmailVariables {
  if (!input) return {};
  const variables: EmailVariables = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      variables[key] = value;
    } else if (typeof value === "string" || typeof value === "number") {
      variables[key] = value;
    } else {
      variables[key] = JSON.stringify(value);
    }
  }
  return variables;
}
