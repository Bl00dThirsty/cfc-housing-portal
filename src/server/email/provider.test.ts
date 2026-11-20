import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { extractAddress, getEmailProvider, ResendProvider } from "@/server/email/provider";

/**
 * Fournisseurs de messagerie.
 *
 * Propriété critique : **sans configuration, le service ne doit pas
 * échouer**. `getEmailProvider()` renvoie `null`, et la chaîne d'envoi
 * journalise alors `skipped`.
 */

const ENV_KEYS = [
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_TLS_REJECT_UNAUTHORIZED",
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  vi.restoreAllMocks();
});

describe("getEmailProvider", () => {
  it("renvoie null sans aucune configuration de messagerie", () => {
    expect(getEmailProvider()).toBeNull();
  });

  it("retient Resend si une clé API est présente", () => {
    process.env.RESEND_API_KEY = "re_test";

    const provider = getEmailProvider();

    expect(provider?.name).toBe("resend");
  });

  it("retient SMTP si un hôte est présent", () => {
    process.env.SMTP_HOST = "smtp.cfc.cm";

    const provider = getEmailProvider();

    expect(provider?.name).toBe("smtp");
  });

  it("privilégie Resend quand les deux sont configurés", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.SMTP_HOST = "smtp.cfc.cm";

    expect(getEmailProvider()?.name).toBe("resend");
  });

  it("ignore une configuration vide", () => {
    process.env.RESEND_API_KEY = "   ";

    expect(getEmailProvider()).toBeNull();
  });
});

describe("ResendProvider", () => {
  const message = {
    to: "awa@example.cm",
    subject: "Bonjour",
    html: "<p>Bonjour</p>",
    text: "Bonjour",
  };

  it("remonte l'identifiant du message Accepted", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "msg_123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new ResendProvider({ apiKey: "re_test", from: "no-reply@cfc.cm" });
    const result = await provider.send(message);

    expect(result.ok).toBe(true);
    expect(result.messageId).toBe("msg_123");
    expect(result.error).toBeNull();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
  });

  it("remonte l'erreur renvoyée par l'API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: "Invalid from address" }),
      }),
    );

    const provider = new ResendProvider({ apiKey: "re_test", from: "no-reply@cfc.cm" });
    const result = await provider.send(message);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid from address");
  });

  it("ne lève jamais : une panne réseau devient un résultat en échec", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    const provider = new ResendProvider({ apiKey: "re_test", from: "no-reply@cfc.cm" });
    const result = await provider.send(message);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("ECONNREFUSED");
  });
});

describe("extractAddress", () => {
  it("extrait l'adresse d'un en-tête nom + adresse", () => {
    expect(extractAddress("Crédit Foncier <no-reply@cfc.cm>")).toBe("no-reply@cfc.cm");
  });

  it("accepte une adresse nue", () => {
    expect(extractAddress("no-reply@cfc.cm")).toBe("no-reply@cfc.cm");
  });

  it("retombe sur une adresse par défaut si l'en-tête n'en contient pas", () => {
    expect(extractAddress("Crédit Foncier")).toBe("no-reply@cfchousing.cm");
  });
});
