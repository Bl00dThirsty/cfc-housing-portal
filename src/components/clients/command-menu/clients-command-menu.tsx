"use client";

import * as React from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Kbd,
} from "@/components/ui/command";
import { useClientsStore } from "@/stores/clients-store";

import type { ClientItem } from "@/domain/entities/client";

type ClientsCommandMenuProps = {
  clients: ClientItem[];
  onSelect: (client: ClientItem) => void;
};

export function ClientsCommandMenu({
  clients,
  onSelect,
}: ClientsCommandMenuProps) {
  const commandOpen = useClientsStore((state) => state.commandOpen);
  const setCommandOpen = useClientsStore((state) => state.setCommandOpen);
  const openDetail = useClientsStore((state) => state.openDetail);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;
      if (event.altKey || event.shiftKey) return;
      event.preventDefault();
      setCommandOpen(!commandOpen);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [commandOpen, setCommandOpen]);

  const run = (action: () => void) => {
    setCommandOpen(false);
    setQuery("");
    action();
  };

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      title="Recherche rapide des emprunteurs"
      description="Tapez pour rechercher un emprunteur par nom, numéro de dossier ou agence."
    >
      <Command
        loop
        value={query}
        onValueChange={setQuery}
        filter={(value, search) =>
          value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
        }
      >
        <CommandInput placeholder="Rechercher un emprunteur, un DUC, une agence…" />

        <CommandList>
          <CommandEmpty>
            Aucun emprunteur ne correspond à cette recherche.
          </CommandEmpty>

          <CommandGroup heading="Emprunteurs">
            {clients.map((client) => (
              <CommandItem
                key={client.id}
                value={`${client.name} ${client.ducId} ${client.agency}`}
                onSelect={() =>
                  run(() => {
                    onSelect(client);
                    openDetail(client.id);
                  })
                }
              >
                <span className="truncate font-medium text-foreground">
                  {client.name}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-soft">
                  {client.ducId}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        <CommandFooter>
          <span>{clients.length} emprunteur(s)</span>
          <span className="ml-auto flex items-center gap-1.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
            pour ouvrir · <Kbd>Échap</Kbd> pour fermer
          </span>
        </CommandFooter>
      </Command>
    </CommandDialog>
  );
}
