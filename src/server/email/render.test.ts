import { describe, expect, it } from "vitest";

import {
  MissingVariableError,
  escapeHtml,
  extractPlaceholders,
  renderTemplate,
  renderTemplateOrThrow,
  toVariables,
} from "@/server/email/render";

/**
 * Moteur de rendu des modèles d'e-mail.
 *
 * Les trois propriétés critiques sont vérifiées ici :
 * - la substitution des `{{variables}}` ;
 * - l'**échappement HTML** des valeurs (une donnée saisie par un citoyen ne
 *   doit jamais pouvoir injecter de balise) ;
 * - le signalement des variables manquantes.
 */

describe("escapeHtml", () => {
  it("neutralise les balises et les attributs", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
    expect(escapeHtml('a "b" \'c\'')).toBe("a &quot;b&quot; &#39;c&#39;");
  });

  it("échappe l'ampersand en premier pour éviter le double échappement", () => {
    expect(escapeHtml("R&D")).toBe("R&amp;D");
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});

describe("extractPlaceholders", () => {
  it("liste les variables citées, sans doublon, dans l'ordre", () => {
    expect(extractPlaceholders("Bonjour {{prenom}} {{nom}}, {{prenom}}")).toEqual([
      "prenom",
      "nom",
    ]);
  });

  it("tolère les espaces internes", () => {
    expect(extractPlaceholders("Bonjour {{ prenom }}")).toEqual(["prenom"]);
  });

  it("ignore les accolades non étiquetées", () => {
    expect(extractPlaceholders("100 % de {prenom}")).toEqual([]);
  });
});

describe("renderTemplate", () => {
  const template = {
    subject: "Bienvenue {{prenom}} {{nom}}",
    html: "<p>Bonjour {{prenom}} {{nom}}</p><a href=\"{{lien}}\">Ouvrir</a>",
    text: "Bonjour {{prenom}} {{nom}} — {{lien}}",
    variables: ["prenom", "nom", "lien"],
  };

  it("substitue les variables dans l'objet et les deux corps", () => {
    const rendered = renderTemplate(template, {
      prenom: "Awa",
      nom: "Njoya",
      lien: "https://cfc.cm/portal",
    });

    expect(rendered.subject).toBe("Bienvenue Awa Njoya");
    expect(rendered.html).toContain("Bonjour Awa Njoya");
    expect(rendered.text).toContain("Bonjour Awa Njoya — https://cfc.cm/portal");
    expect(rendered.missing).toEqual([]);
  });

  it("échappe les valeurs insérées dans le corps HTML", () => {
    const rendered = renderTemplate(template, {
      prenom: '<script>alert("xss")</script>',
      nom: "Njoya & Fils",
      lien: "https://cfc.cm/portal",
    });

    // Le balisage injecté ne doit jamais devenir une balise.
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.html).toContain("Njoya &amp; Fils");
    // Le guillemet est échappé : impossible de refermer l'attribut href.
    expect(rendered.html).toContain("&quot;xss&quot;");
  });

  it("neutralise une tentative d'injection dans l'attribut d'un lien", () => {
    const rendered = renderTemplate(template, {
      prenom: "Awa",
      nom: "Njoya",
      lien: '" onmouseover="alert(1)',
    });

    expect(rendered.html).not.toContain('onmouseover="alert(1)"');
    expect(rendered.html).toContain("&quot;");
  });

  it("signale les variables manquantes", () => {
    const rendered = renderTemplate(template, { prenom: "Awa" });

    expect(rendered.missing).toEqual(["nom", "lien"]);
  });

  it("considère une variable vide comme manquante", () => {
    const rendered = renderTemplate(template, { prenom: "Awa", nom: "   ", lien: "x" });

    expect(rendered.missing).toEqual(["nom"]);
  });

  it("rend une variable absente par une chaîne vide sans planter", () => {
    const rendered = renderTemplate(template, { prenom: "Awa", nom: "Njoya", lien: "x" });

    expect(rendered.subject).toBe("Bienvenue Awa Njoya");
  });

  it("signale les variables utilisées mais non déclarées", () => {
    const rendered = renderTemplate(
      { ...template, variables: ["prenom"] },
      { prenom: "Awa", nom: "Njoya", lien: "x" },
    );

    expect(rendered.undeclared).toEqual(["nom", "lien"]);
    expect(rendered.missing).toEqual([]);
  });

  it("interdit le retour à la ligne dans l'objet (injection d'en-tête)", () => {
    const rendered = renderTemplate(template, {
      prenom: "Awa\r\nBcc: pirate@example.com",
      nom: "Njoya",
      lien: "x",
    });

    expect(rendered.subject).not.toContain("\n");
    expect(rendered.subject).toContain("Bcc: pirate@example.com");
  });

  it("laisse le corps texte tel quel : il n'est pas interprété comme du balisage", () => {
    const rendered = renderTemplate(template, {
      prenom: "<b>Awa</b>",
      nom: "Njoya",
      lien: "x",
    });

    expect(rendered.text).toContain("<b>Awa</b>");
  });
});

describe("renderTemplateOrThrow", () => {
  const template = {
    subject: "Bonjour {{prenom}}",
    html: "<p>{{prenom}}</p>",
    text: "{{prenom}}",
    variables: ["prenom"],
  };

  it("rend sans erreur si toutes les variables sont là", () => {
    expect(renderTemplateOrThrow(template, { prenom: "Awa" }).subject).toBe("Bonjour Awa");
  });

  it("lève MissingVariableError si une variable manque", () => {
    expect(() => renderTemplateOrThrow(template, {})).toThrow(MissingVariableError);

    try {
      renderTemplateOrThrow(template, {});
    } catch (caught) {
      expect((caught as MissingVariableError).missing).toEqual(["prenom"]);
    }
  });
});

describe("toVariables", () => {
  it("conserve les chaînes, les nombres et les valeurs nulles", () => {
    const variables = toVariables({ a: "x", b: 2, c: null, d: undefined });

    expect(variables).toEqual({ a: "x", b: 2, c: null, d: undefined });
  });

  it("sérialise les objets en JSON", () => {
    expect(toVariables({ a: { b: 1 } }).a).toBe('{"b":1}');
  });

  it("renvoie une map vide pour une entrée absente", () => {
    expect(toVariables(null)).toEqual({});
    expect(toVariables(undefined)).toEqual({});
  });
});
