"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Calculator, FileText, UserCheck, Building2 } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const isAdminActive = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center space-x-4 group">
          <div className="relative h-11 w-40 sm:w-44 transition-transform group-hover:scale-[1.02]">
            <Image
              src="/images/logo-cfc.png"
              alt="Crédit Foncier du Cameroun"
              fill
              priority
              className="object-contain"
            />
          </div>
          <div className="hidden md:block pl-4 border-l border-slate-200">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cfc-lightgold text-cfc-brown border border-cfc-gold/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cfc-gold animate-pulse"></span>
              Campagne Épargne Habitat
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">Portail & Guichet Unique Dématérialisé</p>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 text-xs font-medium">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              pathname === "/"
                ? "bg-white text-cfc-brown shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Vitrine Épargne
          </Link>
          <Link
            href="/simulator"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              pathname.startsWith("/simulator")
                ? "bg-white text-cfc-brown shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Simulateur
          </Link>
          <Link
            href="/onboarding"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              pathname.startsWith("/onboarding")
                ? "bg-white text-cfc-brown shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Onboarding KYC
          </Link>
          <Link
            href="/portal"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              pathname.startsWith("/portal")
                ? "bg-white text-cfc-brown shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Guichet Unique
          </Link>
        </nav>

        {/* Role Switcher Button */}
        <div className="flex items-center gap-2">
          {isAdminActive ? (
            <Link
              href="/"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
            >
              <span>← Vue Citoyen</span>
            </Link>
          ) : (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cfc-brown hover:bg-cfc-darkbrown text-white transition-all shadow-sm"
            >
              <Building2 className="w-3.5 h-3.5 text-cfc-gold" />
              <span>Espace Agent CFC</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
