import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SupportChat } from "@/components/support/support-chat";

/**
 * Le fil de support ne doit **jamais** faire passer un échec pour une absence.
 *
 * Une conversation illisible ne doit pas ressembler à une conversation vide,
 * et un message refusé ne doit pas disparaître sans un mot.
 */

const { sent, fakeClient } = vi.hoisted(() => {
  const sent: unknown[] = [];

  const fakeChannel = {
    on: () => fakeChannel,
    subscribe: (callback: (status: string) => void) => {
      callback("SUBSCRIBED");
      return fakeChannel;
    },
    send: async (payload: unknown) => {
      sent.push(payload);
    },
  };

  // Le client est **stable** : le hook l'a en dépendance, un nouvel objet à
  // chaque rendu le ferait se réabonner sans fin.
  const fakeClient = {
    channel: () => fakeChannel,
    removeChannel: () => {},
  };

  return { sent, fakeClient };
});

vi.mock("@/lib/supabase/client", () => ({
  getBrowserClient: () => fakeClient,
}));

const actions = vi.hoisted(() => ({
  list: vi.fn(),
  send: vi.fn(),
  sign: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/server/actions/support", () => ({
  listSupportMessagesAction: actions.list,
  sendSupportMessageAction: actions.send,
  signSupportAttachmentsAction: actions.sign,
  requestSupportUploadAction: actions.upload,
}));

beforeEach(() => {
  sent.length = 0;
  actions.list.mockReset();
  actions.send.mockReset();
  actions.sign.mockReset();
  actions.upload.mockReset();

  actions.sign.mockResolvedValue({ ok: true, data: {} });
});

/**
 * Attend que le fil soit **connecté**.
 *
 * Le composeur est désactivé tant que le canal temps réel n'a pas confirmé
 * l'abonnement : taper avant ce moment n'écrit rien. Un test qui ignore cet
 * état passe parfois et échoue parfois — il faut donc attendre l'état réel.
 */
async function waitForConnection() {
  await screen.findByText("Connexion au fil établie.");
}

describe("fil de support — les refus sont affichés", () => {
  it("affiche un état d'erreur quand la conversation ne se charge pas", async () => {
    actions.list.mockResolvedValue({ ok: false, error: "Base de données inaccessible." });

    render(
      <SupportChat roomName="dossier:1" dossierId="dossier-1" displayName="EBAH" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Conversation indisponible")).toBeInTheDocument();
    });
    expect(screen.getByText("Base de données inaccessible.")).toBeInTheDocument();
    // L'échec ne doit pas se confondre avec une conversation vide.
    expect(screen.queryByText(/Aucun message/)).not.toBeInTheDocument();
  });

  it("affiche un refus quand l'envoi échoue, sans perdre le texte", async () => {
    actions.list.mockResolvedValue({ ok: true, data: [] });
    actions.send.mockResolvedValue({ ok: false, error: "Message refusé." });

    const user = userEvent.setup();

    const { container } = render(
      <SupportChat roomName="dossier:1" dossierId="dossier-1" displayName="EBAH" />,
    );

    const composer = (await screen.findByLabelText(
      "Votre message",
    )) as HTMLTextAreaElement;

    await waitForConnection();

    await user.type(composer, "Bonjour, je souhaite deposer une piece");

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await user.click(submit);

    await waitFor(() => {
      expect(
        screen.getByText(/Votre message n'a pas pu être enregistré/),
      ).toBeInTheDocument();
    });

    // Le texte n'est pas perdu : l'emprunteur peut réessayer.
    expect(composer).toHaveValue("Bonjour, je souhaite deposer une piece");
    // Rien n'a été diffusé à l'interlocuteur.
    expect(sent).toHaveLength(0);
  });

  it("affiche un refus quand la pièce jointe n'est pas déposée", async () => {
    actions.list.mockResolvedValue({ ok: true, data: [] });
    actions.upload.mockResolvedValue({ ok: false, error: "Dépôt refusé." });

    const user = userEvent.setup();

    const { container } = render(
      <SupportChat roomName="dossier:1" dossierId="dossier-1" displayName="EBAH" />,
    );

    await screen.findByLabelText("Votre message");
    await waitForConnection();

    const file = new File(["contenu"], "piece.pdf", { type: "application/pdf" });
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByText(/La pièce jointe n'a pas pu être déposée/),
      ).toBeInTheDocument();
    });
  });
});

/** Message de fil, tel que le serveur le rend. */
function persistedMessage(overrides: Record<string, unknown>) {
  return {
    id: "m1",
    room_name: "dossier:1",
    dossier_id: "dossier-1",
    author_user_id: "u1",
    author_name: "Conseiller CFC",
    author_role: "ADMIN",
    content: "Bien reçu, je vérifie ce document.",
    created_at: "2026-11-12T10:00:00.000Z",
    reply_to_id: null,
    attachment: null,
    step_code: null,
    document_id: null,
    ...overrides,
  };
}

describe("fil de support — la réponse citée", () => {
  it("affiche la réponse citée d'un message déjà enregistré", async () => {
    actions.list.mockResolvedValue({
      ok: true,
      data: [
        persistedMessage({}),
        persistedMessage({
          id: "m2",
          author_user_id: "u2",
          author_name: "EBAH",
          content: "Merci pour votre retour.",
          created_at: "2026-11-12T10:01:00.000Z",
          reply_to_id: "m1",
        }),
      ],
    });

    render(
      <SupportChat roomName="dossier:1" dossierId="dossier-1" displayName="EBAH" />,
    );

    await waitForConnection();

    // Le texte cité est celui du message auquel on répond, avec son auteur.
    // L'auteur apparaît deux fois : l'en-tête de la bulle d'origine, et la
    // citation. Le texte cité, lui aussi : le message, et sa reprise.
    await waitFor(() => {
      expect(screen.getAllByText("Conseiller CFC")).toHaveLength(2);
    });
    expect(
      screen.getAllByText("Bien reçu, je vérifie ce document."),
    ).toHaveLength(2);
    expect(screen.getByText("Merci pour votre retour.")).toBeInTheDocument();
  });

  it("enregistre une réponse à un message qui part à l'instant, sous son identifiant réel", async () => {
    actions.list.mockResolvedValue({ ok: true, data: [] });

    // Le premier envoi reste en vol : la réponse part **avant** qu'il ne soit
    // confirmé. Elle doit malgré tout viser l'identifiant **stocké**, jamais
    // l'identifiant optimiste — celui-ci n'existe pas en base.
    let resolveFirst: (value: unknown) => void = () => {};
    const firstPending = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    actions.send.mockImplementation((input: { content: string }) => {
      if (input.content === "Bonjour") {
        return firstPending.then(() => ({
          ok: true,
          data: persistedMessage({ id: "stored-1", content: "Bonjour" }),
        }));
      }
      return Promise.resolve({
        ok: true,
        data: persistedMessage({
          id: "stored-2",
          author_name: "EBAH",
          content: "Une question",
          reply_to_id: "stored-1",
        }),
      });
    });

    const user = userEvent.setup();

    const { container } = render(
      <SupportChat roomName="dossier:1" dossierId="dossier-1" displayName="EBAH" />,
    );

    const composer = (await screen.findByLabelText(
      "Votre message",
    )) as HTMLTextAreaElement;

    await waitForConnection();

    await user.type(composer, "Bonjour");
    await user.click(container.querySelector('button[type="submit"]') as HTMLButtonElement);

    // Le message optimiste est affiché : on peut déjà y répondre.
    const replyButton = await screen.findByRole("button", {
      name: /Répondre à ce message/,
    });
    await user.click(replyButton);

    await user.type(composer, "Une question");
    await user.click(container.querySelector('button[type="submit"]') as HTMLButtonElement);

    // L'envoi du premier message se confirme : la réponse part alors avec
    // l'identifiant réel.
    resolveFirst(undefined);

    await waitFor(() => {
      expect(actions.send).toHaveBeenCalledTimes(2);
    });

    const secondCall = actions.send.mock.calls[1]?.[0] as {
      replyToId: string | null;
    };
    expect(secondCall.replyToId).toBe("stored-1");
    expect(secondCall.replyToId).not.toMatch(/^[0-9a-f-]{36}$/);
  });
});
