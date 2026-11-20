"use client";

/**
 * Sélecteur d'émojis.
 *
 * Une palette courte et curée, dans une `Popover` : le fil de support parle
 * d'un dossier, il n'a pas besoin de la banque d'émojis d'un réseau social.
 * Les émojis sont insérés **à la position du curseur** dans le message en
 * cours de saisie.
 */

import * as React from "react";
import { Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Palette proposée : les usages les plus fréquents d'une conversation de dossier. */
export const EMOJI_PALETTE = [
  "👍", "🙏", "👋", "✅", "❌", "❓",
  "📄", "📎", "🗂️", "📐", "📌", "🔎",
  "💰", "🏦", "📅", "⏳", "🔔", "⚠️",
  "😊", "😄", "🙏🏽", "🤝", "💡", "⭐",
] as const;

export interface EmojiPickerProps {
  /** Insère l'emoji choisi à la position du curseur. */
  onSelect: (emoji: string) => void;
  /** Le bouton est-il neutralisé ? */
  disabled?: boolean;
}

export function EmojiPicker({ onSelect, disabled }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="Insérer un emoji"
          className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        >
          <Smile className="size-4" aria-hidden />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-2">
        <p className="px-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
          Émojis
        </p>
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_PALETTE.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              aria-label={`Insérer ${emoji}`}
              className="flex size-7 items-center justify-center rounded-md text-base transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
