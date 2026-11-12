"use server";

/**
 * Actions de la boîte de notifications.
 *
 * La lecture passe par le client **authentifié** de la requête : la RLS
 * limite chaque agent à ses propres notifications. L'écriture passe par le
 * rôle de service (cf. `src/server/notifications/notify.ts`).
 */

import { createServerSupabaseClient } from "@/server/supabase/server";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  dossier_id: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationsResult =
  | { ok: true; notifications: NotificationRow[]; unreadCount: number }
  | { ok: false; error: string };

export async function listNotificationsAction(limit = 20): Promise<NotificationsResult> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Session requise." };

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, dossier_id, action_url, read_at, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, error: error.message };

    const notifications = (data ?? []) as NotificationRow[];
    const unreadCount = notifications.filter((item) => item.read_at === null).length;

    return { ok: true, notifications, unreadCount };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inattendue.",
    };
  }
}

export async function markNotificationReadAction(notificationId: string): Promise<NotificationsResult> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .is("read_at", null);

    if (error) return { ok: false, error: error.message };

    return listNotificationsAction();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inattendue.",
    };
  }
}

export async function markAllNotificationsReadAction(): Promise<NotificationsResult> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);

    if (error) return { ok: false, error: error.message };

    return listNotificationsAction();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur inattendue.",
    };
  }
}
