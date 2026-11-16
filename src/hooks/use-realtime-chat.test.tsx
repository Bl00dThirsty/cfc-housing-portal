import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import type { ChatMessage } from "@/hooks/use-realtime-chat";

/**
 * L'ordre d'écriture du fil — **écrire, puis diffuser**.
 *
 * Un message porte d'abord un identifiant optimiste : il n'existe pas encore
 * en base. Diffuser cet identifiant obligerait l'interlocuteur à répondre à
 * un message que la base ne connaît pas — la clé étrangère le refuserait.
 * Le fil diffuse donc la version **écrite**.
 */
const { sent, fakeChannel } = vi.hoisted(() => {
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

  return { sent, fakeChannel };
});

vi.mock("@/lib/supabase/client", () => ({
  getBrowserClient: () => ({
    channel: () => fakeChannel,
    removeChannel: () => {},
  }),
}));

async function loadHook() {
  const { useRealtimeChat } = await import("@/hooks/use-realtime-chat");
  return useRealtimeChat;
}

describe("fil de support — diffusion après écriture", () => {
  it("diffuse l'identifiant écrit, pas l'identifiant optimiste", async () => {
    sent.length = 0;

    const useRealtimeChat = await loadHook();

    const optimistic: ChatMessage = {
      id: "optimiste-1",
      content: "Bonjour",
      user: { name: "EBAH" },
      createdAt: "2026-11-12T10:00:00.000Z",
    };

    const persisted: ChatMessage = { ...optimistic, id: "stocke-1" };

    const { result } = renderHook(() =>
      useRealtimeChat({
        roomName: "dossier:1",
        username: "EBAH",
        onSend: async () => persisted,
      }),
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    await result.current.sendMessage(optimistic);

    await waitFor(() => expect(sent).toHaveLength(1));

    const payload = sent[0] as { payload: ChatMessage };
    expect(payload.payload.id).toBe("stocke-1");
    expect(payload.payload.id).not.toBe("optimiste-1");
  });

  it("retire le message optimiste et ne diffuse rien quand l'écriture échoue", async () => {
    sent.length = 0;

    const useRealtimeChat = await loadHook();

    const optimistic: ChatMessage = {
      id: "optimiste-2",
      content: "Bonjour",
      user: { name: "EBAH" },
      createdAt: "2026-11-12T10:00:00.000Z",
    };

    const { result } = renderHook(() =>
      useRealtimeChat({
        roomName: "dossier:1",
        username: "EBAH",
        onSend: async () => null,
      }),
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    await result.current.sendMessage(optimistic);

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(0);
    });
    expect(sent).toHaveLength(0);
  });

  it("diffuse la réponse et son identifiant de message cité", async () => {
    sent.length = 0;

    const useRealtimeChat = await loadHook();

    const reply: ChatMessage = {
      id: "optimiste-3",
      content: "D'accord",
      user: { name: "EBAH" },
      createdAt: "2026-11-12T10:01:00.000Z",
      replyToId: "stocke-1",
      replyTo: { id: "stocke-1", authorName: "Conseiller", content: "Bonjour" },
    };

    const { result } = renderHook(() =>
      useRealtimeChat({
        roomName: "dossier:1",
        username: "EBAH",
        onSend: async (message) => ({ ...message, id: "stocke-3" }),
      }),
    );

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    await result.current.sendMessage(reply);

    await waitFor(() => expect(sent).toHaveLength(1));

    const payload = sent[0] as { payload: ChatMessage };
    expect(payload.payload.id).toBe("stocke-3");
    expect(payload.payload.replyToId).toBe("stocke-1");
  });
});
