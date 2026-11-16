"use client";

import * as React from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CountBadge } from "@/components/ui/count-badge";
import { ErrorState } from "@/components/ui/error-state";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type NotificationRow,
} from "@/server/actions/notifications";

import { NotificationItem } from "./notification-item";

type Filter = "all" | "unread";

/**
 * Cloche de notifications — enveloppe de l'espace de travail CFC.
 *
 * Le compteur se met à jour **en temps réel** (canal `postgres_changes`
 * filtré sur le destinataire) et par rechargement à l'ouverture. Le filtrage
 * « Toutes / Non lues » est le même que celui du kit de référence.
 */
export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [notifications, setNotifications] = React.useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  /** Message d'erreur : une cloche muette ne doit pas passer pour une boîte vide. */
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const result = await listNotificationsAction();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
  }, []);

  React.useEffect(() => {
    void load();

    const supabase = getBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    /**
     * Le nettoyage peut survenir **avant** que la session soit revenue : le
     * canal n'existe pas encore, et il ne doit surtout pas s'abonner après
     * coup. Ce drapeau ferme la porte.
     */
    let cancelled = false;

    void supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || cancelled) return;

      // Le nom du canal porte l'identifiant : deux cloches ne se marchent
      // pas dessus, et un canal resté vivant ne peut pas être réutilisé.
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_user_id=eq.${userId}`,
          },
          (payload) => {
            // Une notification qui arrive se dit : l'utilisateur n'a pas à
            // ouvrir la cloche pour apprendre qu'il a reçu quelque chose.
            const inserted = payload.new as { title?: string } | undefined;
            if (inserted?.title) {
              toast.info(inserted.title, { description: "Nouvelle notification" });
            }
            void load();
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  const handleOpen = async (value: boolean) => {
    setOpen(value);
    if (value) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    const result = await markNotificationReadAction(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
  };

  const markAllRead = async () => {
    const result = await markAllNotificationsReadAction();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
  };

  const visible = notifications.filter(
    (item) => filter === "all" || item.read_at === null,
  );

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} non lue(s)`
              : "Notifications"
          }
          className={`data-[state=open]:bg-muted relative ${className ?? ""}`}
        >
          <Bell aria-hidden className="size-3.5" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="bg-danger ring-secondary absolute top-[7px] right-[7px] size-1.5 rounded-full ring-2"
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[min(400px,calc(100vw-2rem))]">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && <CountBadge>{unreadCount}</CountBadge>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0}
            onClick={markAllRead}
            className="-mr-1.5 text-xs"
          >
            Tout marquer comme lu
          </Button>
        </div>

        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList className="border-line-strong border-b px-4">
            <TabsTrigger value="all" className="py-3 text-xs">
              Toutes
            </TabsTrigger>
            <TabsTrigger value="unread" className="py-3 text-xs">
              Non lues
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Chargement…
          </div>
        ) : error ? (
          <div className="p-3">
            <ErrorState
              title="Notifications indisponibles"
              message={error}
              onRetry={() => void load()}
              className="border-none bg-transparent py-6"
            />
          </div>
        ) : visible.length > 0 ? (
          <ScrollArea viewportClassName="max-h-[min(420px,60dvh)]">
            <ul className="flex flex-col gap-0.5 p-1.5">
              {visible.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  unread={notification.read_at === null}
                  onSelect={() => void handleSelect(notification.id)}
                />
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="bg-muted flex size-10 items-center justify-center rounded-full border border-line-strong">
              <Bell aria-hidden className="text-soft size-4" />
            </span>
            <span className="lead-style mt-1 block font-medium text-foreground">
              {filter === "unread"
                ? "Aucune notification non lue"
                : "Vous êtes à jour"}
            </span>
            <span className="caption-style text-subtle block">
              Les demandes de pièces, les décisions et les messages apparaissent
              ici.
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
