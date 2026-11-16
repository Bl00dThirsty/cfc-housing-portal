"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Calculator, HelpCircle, LayoutDashboard, LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBrowserClient } from "@/lib/supabase/client";

/**
 * En-tête du site public.
 *
 * Il n'affiche que ce qui est **ouvert à tous** : le simulateur d'épargne, la
 * FAQ, et les deux portes du citoyen — **Créer un compte** (l'appel à
 * l'action) et **Se connecter** (le lien discret).
 *
 * Le reste du parcours est ailleurs, et c'est volontaire :
 *
 * - l'**inscription** (`/inscription`) est la seule porte qui ouvre un compte
 *   et le premier dossier : c'est la destination de l'appel à l'action ;
 * - l'**assistant de dossier** (`/onboarding`) reprend le parcours d'un
 *   demandeur déjà connecté ;
 * - l'**espace citoyen** et le **suivi du prêt** viennent **après
 *   l'authentification** — ils ne montrent que les données du visiteur ;
 * - la **porte de l'agent** n'est pas ici : elle est dans le pied de page,
 *   à côté des autres portes du site. Un agent n'est pas un visiteur du site
 *   public, et répéter la même porte sur la même page n'aide personne.
 */
export default function Navbar() {
  const pathname = usePathname();
  const isAdminActive = pathname.startsWith("/portail-cfc");
  /**
   * Sur la page d'inscription, l'appel à l'action ne mène nulle part : on y
   * est déjà. Seul le lien « Se connecter » reste utile.
   */
  const isRegistrationPath = pathname.startsWith("/inscription");

  /**
   * Le visiteur est-il connecté ?
   *
   * L'en-tête public ne propose une porte que si elle sert encore : un
   * visiteur déjà connecté n'a rien à faire de « Se connecter » ni de « Créer
   * un compte ». On demande la session au navigateur — une seule requête,
   * sans rendre dynamique toute l'application.
   */
  const [signedIn, setSignedIn] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    try {
      void getBrowserClient()
        .auth.getSession()
        .then(({ data }) => {
          if (!cancelled) setSignedIn(Boolean(data.session));
        })
        .catch(() => {
          // Une session illisible ne se signale pas : l'en-tête reste public.
        });
    } catch {
      // Sans configuration — un poste de démonstration, un test — l'en-tête
      // reste public : il n'a pas à planter pour cela.
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/login" className="group flex items-center space-x-4">
          <div className="relative h-11 w-40 transition-transform group-hover:scale-[1.02] sm:w-44">
            <Image
              src="/images/logo-cfc.png"
              alt="Crédit Foncier du Cameroun"
              fill
              priority
              sizes="(max-width: 640px) 160px, 176px"
              className="object-contain"
            />
          </div>
          <div className="hidden border-l border-slate-200 pl-4 md:block">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cfc-gold/30 bg-cfc-lightgold px-2.5 py-0.5 text-[11px] font-medium text-cfc-brown">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cfc-gold" />
              Campagne Épargne Habitat
            </span>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Portail &amp; Guichet Unique Dématérialisé
            </p>
          </div>
        </Link>

        {/* Les services ouverts à tous. */}
        <nav
          aria-label="Services publics"
          className="hidden items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-100/80 p-1 text-xs font-medium lg:flex"
        >
          <Link
            href="/simulator"
            aria-current={pathname.startsWith("/simulator") ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
              pathname.startsWith("/simulator")
                ? "bg-white font-semibold text-cfc-brown shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Calculator className="h-3.5 w-3.5" />
            Simulateur
          </Link>
          <Link
            href="/faq"
            aria-current={pathname.startsWith("/faq") ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all",
              pathname.startsWith("/faq")
                ? "bg-white font-semibold text-cfc-brown shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAdminActive ? (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200"
            >
              <span>← Portail Citoyen</span>
            </Link>
          ) : signedIn ? (
            // Le visiteur est déjà connecté : on ne lui propose pas une porte
            // qui ne mène nulle part. « Mon espace » mène à son portail —
            // un agent y sera renvoyé vers sa console.
            <Link
              href="/portail-client"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200"
            >
              <LayoutDashboard className="size-3.5" aria-hidden />
              <span>Mon espace</span>
            </Link>
          ) : (
            <>
              {/* La porte de connexion : discrète, mais toujours là. */}
              <Link
                href="/login"
                aria-label="Se connecter"
                className="flex items-center gap-1.5 rounded-lg p-2 text-[11px] font-medium text-slate-600 transition-colors hover:text-slate-900 sm:p-1 sm:pl-2"
              >
                <LogIn className="size-3.5 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">Se connecter</span>
              </Link>

              {/* L'appel à l'action : entrer par la création du compte. */}
              {!isRegistrationPath && (
                <Button asChild variant="cfc" size="sm" className="gap-1.5 text-xs">
                  <Link href="/inscription">
                    <UserPlus className="size-3.5" aria-hidden />
                    Créer un compte
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
