import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { FAQ_GROUPS, FAQ_ITEM_COUNT } from "@/domain/entities/faq";

export const metadata: Metadata = {
  title: "Foire aux questions | Crédit Foncier du Cameroun",
  description:
    "Ouverture du dossier unique client, épargne-logement, prêt foncier, confidentialité et accès à l'espace agent CFC.",
};

/**
 * Foire aux questions du Guichet Unique.
 *
 * Les réponses décrivent le parcours **réel** de la plateforme : elles
 * vivent dans le domaine (`@/domain/entities/faq`) et sont donc les mêmes
 * partout où elles sont lues.
 */
export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cfc-lightgold px-3 py-1 text-xs font-bold uppercase tracking-widest text-cfc-brown">
          <HelpCircle className="size-3.5" aria-hidden />
          Questions fréquentes
        </span>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Foire aux questions
        </h1>
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          {FAQ_ITEM_COUNT} questions sur le dossier unique client, l&apos;épargne
          logement, le prêt foncier et la confidentialité.
        </p>
      </header>

      <nav aria-label="Sommaire des questions" className="flex flex-wrap justify-center gap-2">
        {FAQ_GROUPS.map((group) => (
          <a
            key={group.id}
            href={`#${group.id}`}
            className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-cfc-gold/40 hover:text-cfc-brown"
          >
            {group.title}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        {FAQ_GROUPS.map((group) => (
          <section
            key={group.id}
            id={group.id}
            aria-labelledby={`faq-${group.id}`}
            className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="space-y-1">
              <h2
                id={`faq-${group.id}`}
                className="text-sm font-semibold text-foreground"
              >
                {group.title}
              </h2>
              <p className="text-xs text-muted-foreground">{group.summary}</p>
            </div>

            <ul className="divide-y divide-border/70">
              {group.items.map((item) => (
                <li key={item.question}>
                  <details className="group py-2.5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-left text-[13px] font-medium text-foreground outline-none transition-colors hover:text-cfc-brown focus-visible:ring-2 focus-visible:ring-ring/40">
                      {item.question}
                      <ChevronDown
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-power3-out group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>

                    <div className="mt-2 space-y-2 pl-0.5">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {item.answer}
                      </p>
                      {item.link ? (
                        <Button asChild variant="muted" size="sm" className="h-7 text-[11px]">
                          <Link href={item.link.href}>{item.link.label}</Link>
                        </Button>
                      ) : null}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="rounded-xl border border-cfc-gold/30 bg-cfc-lightgold p-5 text-center">
        <Tag tone="blue" size="sm" className="mx-auto">
          Question sans réponse ici
        </Tag>
        <p className="mt-2 text-xs leading-relaxed text-cfc-brown">
          Ouvrez le fil de support de votre dossier : votre conseiller répond
          dans le fil, rattaché à l&apos;étape du parcours dont vous parlez.
        </p>
        <Button asChild variant="cfc" size="sm" className="mt-3 text-xs">
          <Link href="/portail-client">Mon espace</Link>
        </Button>
      </footer>
    </div>
  );
}
