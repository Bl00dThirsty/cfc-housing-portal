import { describe, expect, it } from "vitest";

import { factKey } from "@/domain/entities/processes";
import { DOMAIN_EVENT_NOTIFICATIONS } from "@/server/notifications/notify";
import { DEFAULT_EMAIL_TEMPLATES } from "./defaults";
import { buildVariables, DOMAIN_EVENT_TEMPLATES } from "./events";
import { renderTemplate } from "./render";

/**
 * Un modèle ne part pas si une variable lui manque.
 *
 * La chaîne d'envoi ne lève jamais : une variable absente produit une
 * livraison **failed**, un courriel perdu, et rien ne le dit. Ce test est le
 * garde-fou : tout modèle par défaut doit pouvoir être rendu avec les
 * variables que la plateforme sait produire.
 *
 * Les variables que seul le fait connaît — un motif, une pièce, une décision,
 * un téléphone — sont fournies ici : le test dit ce que chaque message
 * attend du fait qu'il raconte.
 */

/** Un destinataire complet : tous les champs que la base peut renseigner. */
const RECIPIENT = {
  email: "emprunteur@cfc.cm",
  fullName: "EBAH Rodrigue",
  ducCode: "CFC-2026-0001",
  dossierId: "11111111-1111-1111-1111-111111111111",
  loanAmount: 7_200_000,
  rate: 5.5,
  durationYears: 15,
  monthlyPayment: 121_450,
  advisor: "TCHOUNGUI Alain",
};

/** Ce que le fait apporte : motif, pièce, décision, téléphone. */
const FACT = {
  motif: "Carnet d'épargne tenu sur six mois manquants.",
  document: "CNI biométrique",
  decision: "Accord favorable",
  telephone: "+237 6 99 12 34 56",
};

describe("modèles d'e-mail par défaut", () => {
  it("se rendent tous sans variable manquante", () => {
    const failures: string[] = [];

    for (const template of Object.values(DEFAULT_EMAIL_TEMPLATES)) {
      const variables = buildVariables({
        recipient: RECIPIENT,
        payload: FACT,
      });

      const rendered = renderTemplate(
        {
          subject: template.subject,
          html: template.html,
          text: template.text,
          variables: template.variables,
        },
        variables,
      );

      if (rendered.missing.length > 0) {
        failures.push(
          `${template.code} : ${rendered.missing.join(", ")}`,
        );
      }
    }

    expect(failures).toEqual([]);
  });

  it("n'emploient aucune variable non déclarée", () => {
    const failures: string[] = [];

    for (const template of Object.values(DEFAULT_EMAIL_TEMPLATES)) {
      const rendered = renderTemplate(
        {
          subject: template.subject,
          html: template.html,
          text: template.text,
          variables: template.variables,
        },
        buildVariables({ recipient: RECIPIENT, payload: FACT }),
      );

      if (rendered.undeclared.length > 0) {
        failures.push(`${template.code} : ${rendered.undeclared.join(", ")}`);
      }
    }

    expect(failures).toEqual([]);
  });

  it("sont tous joignables par un événement métier", () => {
    // Chaque modèle par défaut doit être atteignable : un fait métier
    // produit un courriel, et le modèle par défaut est ce qui part si le
    // catalogue est vide.
    const reachable = new Set(Object.values(DOMAIN_EVENT_TEMPLATES));

    for (const template of Object.values(DEFAULT_EMAIL_TEMPLATES)) {
      // Transport tests are deliberately initiated by the protected admin
      // action and are not bound to a borrower or staff business event.
      expect(reachable.has(template.code) || template.code === "SYSTEM_TEST").toBe(true);
    }

    // Et l'inverse : un événement qui a un modèle doit avoir un modèle par
    // défaut — sinon le courriel part vide.
    for (const code of reachable) {
      expect(DEFAULT_EMAIL_TEMPLATES[code]).toBeDefined();
    }
  });

  it("associe chaque notification citoyenne à un modèle correspondant", () => {
    for (const eventType of Object.keys(DOMAIN_EVENT_NOTIFICATIONS)) {
      const templateCode = DOMAIN_EVENT_TEMPLATES[eventType];
      expect(templateCode, `${eventType} doit avoir un modèle`).toBeDefined();
      expect(DEFAULT_EMAIL_TEMPLATES[templateCode!]?.eventType).toBe(eventType);
    }

    expect(DEFAULT_EMAIL_TEMPLATES[DOMAIN_EVENT_TEMPLATES.SUPPORT_MESSAGE]?.eventType).toBe(
      "SUPPORT_MESSAGE",
    );
  });

  it("distingue les dépôts de pièces et les messages de support pour l'idempotence", () => {
    const shared = {
      dossierId: RECIPIENT.dossierId,
      recipientUserId: "citizen-1",
    };

    expect(
      factKey({
        ...shared,
        eventType: "DOCUMENT_UPLOADED",
        payload: { document_id: "document-1" },
      }),
    ).not.toBe(
      factKey({
        ...shared,
        eventType: "DOCUMENT_UPLOADED",
        payload: { document_id: "document-2" },
      }),
    );

    expect(
      factKey({
        ...shared,
        eventType: "SUPPORT_MESSAGE",
        payload: { message_id: "message-1" },
      }),
    ).not.toBe(
      factKey({
        ...shared,
        eventType: "SUPPORT_MESSAGE",
        payload: { message_id: "message-2" },
      }),
    );

    expect(
      factKey({
        ...shared,
        eventType: "DOCUMENTS_READY",
        payload: { prior_client_case: "deja_au_cfc" },
      }),
    ).not.toBe(
      factKey({
        ...shared,
        eventType: "DOCUMENTS_READY",
        payload: { prior_client_case: "premiere_fois" },
      }),
    );
  });
});
