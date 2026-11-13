import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  message: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: toastMock }));

import { reportAction, reportError } from "@/lib/action-feedback";

describe("retour d'action", () => {
  beforeEach(() => {
    toastMock.success.mockReset();
    toastMock.error.mockReset();
    toastMock.message.mockReset();
  });

  it("signale la réussite", () => {
    const ok = reportAction({ ok: true }, "Dossier enregistré.");

    expect(ok).toBe(true);
    expect(toastMock.success).toHaveBeenCalledWith("Dossier enregistré.");
  });

  it("ne signale rien quand aucun message n'est fourni", () => {
    reportAction({ ok: true });

    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it("signale le refus avec la cause du serveur", () => {
    const ok = reportAction({ ok: false, error: "Base de données inaccessible." });

    expect(ok).toBe(false);
    expect(toastMock.error).toHaveBeenCalledWith("Base de données inaccessible.");
  });

  it("signale un refus isolé", () => {
    reportError("Le transfert a échoué.");

    expect(toastMock.error).toHaveBeenCalledWith("Le transfert a échoué.");
  });
});
