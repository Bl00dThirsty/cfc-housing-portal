"use client";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { usePathname } from "next/navigation";

/**
 * Coquille des pages publiques.
 *
 * Les deux portails ont leur propre chrome : la console CFC rend son
 * alimentation latérale, l'espace citoyen son en-tête. La navigation
 * publique n'y a pas sa place — elle porte les portes d'entrée, qui n'ont
 * rien à faire une fois Connected.
 */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isConsole = pathname.startsWith("/portail-cfc");
  const isCitizenPortal = pathname.startsWith("/portail-client");

  // La console a son propre chrome, sans barre publique ni pied de page.
  if (isConsole) {
    return <>{children}</>;
  }

  if (isCitizenPortal) {
    return (
      <>
        <main className="flex-1">{children}</main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
