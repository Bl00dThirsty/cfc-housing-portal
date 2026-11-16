"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getBrowserClient } from "@/lib/supabase/client";

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
  /**
   * Persiste un message — le fil doit survivre à la session.
   *
   * Le retour est le message **écrit** : c'est lui qui est diffusé. L'ordre
   * compte — la diffusion porte l'identifiant de la base, donc une réponse à
   * ce message peut le viser, des deux côtés du fil.
   *
   * Une écriture échouée renvoie `null` : le message optimiste est alors
   * retiré et rien n'est diffusé.
   */
  onSend?: (message: ChatMessage) => Promise<ChatMessage | null> | ChatMessage | null;
}

/** Pièce jointe portée par un message. */
export interface ChatAttachment {
  /** Chemin de l'objet dans le coffre `support-attachments`. */
  path: string;
  name: string;
  mime: string;
  size: number;
}

/** Message auquel un message répond — l'aperçu cité dans la bulle. */
export interface ChatReply {
  id: string;
  authorName: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  user: {
    name: string;
  };
  createdAt: string;
  /** Pièce jointe, si le message en porte une. */
  attachment?: ChatAttachment | null;
  /** Message auquel celui-ci répond. */
  replyTo?: ChatReply | null;
  /**
   * Identifiant du message cité.
   *
   * Il est distinct de `replyTo` : l'aperçu cité est **résolu** depuis le
   * fil, alors que l'identifiant est ce que la base connaît.
   */
  replyToId?: string | null;
  /** Étape du circuit visée (`CRD-07`). */
  stepCode?: string | null;
  /** Pièce du dossier visée. */
  documentId?: string | null;
}

const EVENT_MESSAGE_TYPE = "message";

export function useRealtimeChat({ roomName, username, onSend }: UseRealtimeChatProps) {
  const supabase = getBrowserClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newChannel = supabase.channel(roomName);

    newChannel
      .on("broadcast", { event: EVENT_MESSAGE_TYPE }, (payload) => {
        const received = payload.payload as ChatMessage;
        // Un message **reçu** se dit. Celui que l'utilisateur vient
        // d'envoyer ne le doit pas : il l'a déjà sous les yeux.
        if (received.user.name !== username) {
          toast.info(`Nouveau message de ${received.user.name}`);
        }
        setMessages((current) => [...current, received]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [roomName, username, supabase]);

  /**
   * Diffuse un message.
   *
   * L'auteur voit son message immédiatement : il est ajouté à l'état local
   * avant toute écriture. Ensuite l'écriture a lieu, et c'est la version
   * **écrite** qui est diffusée — son identifiant est celui de la base, donc
   * une réponse à ce message peut la viser des deux côtés du fil.
   *
   * Renvoie `false` quand l'écriture a échoué : le message optimiste est
   * alors retiré, et l'appelant peut le signaler.
   */
  const sendMessage = useCallback(
    async (message: ChatMessage): Promise<boolean> => {
      if (!channel || !isConnected) return false;

      setMessages((current) => [...current, message]);

      const persisted = onSend ? await onSend(message) : null;

      if (onSend && !persisted) {
        // L'écriture a échoué : le message optimiste disparaît, et rien n'est
        // diffusé — l'interlocuteur ne doit pas voir un message inexistant.
        setMessages((current) => current.filter((item) => item.id !== message.id));
        return false;
      }

      const outgoing = persisted ?? message;

      setMessages((current) =>
        current.map((item) => (item.id === message.id ? outgoing : item)),
      );

      await channel.send({
        type: "broadcast",
        event: EVENT_MESSAGE_TYPE,
        payload: outgoing,
      });

      return true;
    },
    [channel, isConnected, onSend],
  );

  return { messages, sendMessage, isConnected };
}
