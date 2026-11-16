import { getAdminClient } from "@/server/supabase/admin";
import { createServerSupabaseClient } from "@/server/supabase/server";

/**
 * File de support de la console CFC — les conversations en cours.
 *
 * Une conversation est **une pièce du dossier** : le fil est indexé par
 * dossier, pas par un identifiant de ticket séparé. C'est ce qui permet à
 * l'emprunteur de retrouver sa conversation depuis son dossier, et à l'agent
 * de la rattacher à ce qu'il instruit.
 *
 * La lecture suit le périmètre de l'agent : la RLS de `support_messages` ne
 * laisse voir que les dossiers qu'il peut instruire.
 */

/** Une conversation, telle qu'elle apparaît dans la liste de l'agent. */
export type SupportConversation = {
  dossierId: string;
  ducCode: string;
  /** Nom de l'emprunteur. */
  citizenName: string | null;
  /** Nombre de messages échangés. */
  messageCount: number;
  /** Horodatage du dernier message. */
  lastMessageAt: string;
  /** Aperçu du dernier message. */
  lastMessagePreview: string;
  /** Le dernier message porte-t-il une pièce jointe ? */
  hasAttachment: boolean;
  /** Étape du circuit sur laquelle la conversation est ancrée. */
  stepCode: string | null;
  /** Pièce du dossier sur laquelle la conversation est ancrée. */
  documentId: string | null;
}

export type SupportConversationsResult =
  | { ok: true; conversations: SupportConversation[] }
  | { ok: false; error: string };

export async function listSupportConversations(): Promise<SupportConversationsResult> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Session requise." };

    const { data, error } = await supabase
      .from("support_messages")
      .select(
        "room_name, dossier_id, content, created_at, author_name, attachment_path, step_code, document_id",
      )
      .not("dossier_id", "is", null)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) return { ok: false, error: error.message };

    const rows = (data ?? []) as {
      room_name: string;
      dossier_id: string | null;
      content: string;
      created_at: string;
      author_name: string;
      attachment_path: string | null;
      step_code: string | null;
      document_id: string | null;
    }[];

    // Les messages arrivent du plus récent au plus ancien : le premier
    // message rencontré d'une pièce est son dernier.
    const byDossier = new Map<string, SupportConversation>();
    const counts = new Map<string, number>();

    for (const row of rows) {
      const dossierId = row.dossier_id;
      if (!dossierId) continue;

      counts.set(dossierId, (counts.get(dossierId) ?? 0) + 1);

      if (byDossier.has(dossierId)) continue;

      byDossier.set(dossierId, {
        dossierId,
        ducCode: "",
        citizenName: null,
        messageCount: 0,
        lastMessageAt: row.created_at,
        lastMessagePreview: row.content.slice(0, 140) || "Pièce jointe",
        hasAttachment: Boolean(row.attachment_path),
        stepCode: row.step_code,
        documentId: row.document_id,
      });
    }

    for (const [dossierId, conversation] of byDossier) {
      conversation.messageCount = counts.get(dossierId) ?? 0;
    }

    const dossiers = await adminDossierLabels([...byDossier.keys()]);

    const conversations = [...byDossier.values()]
      .map((conversation) => {
        const label = dossiers.get(conversation.dossierId);
        return {
          ...conversation,
          ducCode: label?.ducCode ?? conversation.dossierId.slice(0, 8),
          citizenName: label?.name ?? null,
        };
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

    return { ok: true, conversations };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inattendue.",
    };
  }
}

/** Libellés des dossiers : numéro DUC et nom de l'emprunteur. */
async function adminDossierLabels(
  dossierIds: string[],
): Promise<Map<string, { ducCode: string; name: string | null }>> {
  if (dossierIds.length === 0) return new Map();

  const admin = getAdminClient();
  const { data } = await admin
    .from("dossiers")
    .select("id, duc_code, name")
    .in("id", dossierIds);

  const labels = new Map<string, { ducCode: string; name: string | null }>();
  for (const row of (data ?? []) as {
    id: string;
    duc_code: string;
    name: string | null;
  }[]) {
    labels.set(row.id, { ducCode: row.duc_code, name: row.name });
  }
  return labels;
}
